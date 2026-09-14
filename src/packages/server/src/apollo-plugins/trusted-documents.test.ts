import { describe, it, expect } from 'vitest';
import { HeaderMap } from '@apollo/server';
import type { GraphQLRequestListener } from '@apollo/server';

import { trustedDocumentsPlugin, TRUSTED_DOCUMENT_REJECTED } from './trusted-documents';
import type { TrustedDocumentAllowList, TrustedDocumentManifest } from '../config';

const WEB_QUERY = 'query Tasks {\n  tasks {\n    id\n  }\n}';
const MOBILE_QUERY = 'query Devices {\n  devices {\n    id\n  }\n}';

const WEB_ID = 'web-hash';
const MOBILE_ID = 'mobile-hash';

const manifest: TrustedDocumentManifest = {
	format: 'graphweaver-trusted-documents',
	version: 1,
	allowLists: {
		web: { [WEB_ID]: { body: WEB_QUERY, operationName: 'Tasks', operationType: 'query' } },
		mobile: {
			[MOBILE_ID]: { body: MOBILE_QUERY, operationName: 'Devices', operationType: 'query' },
		},
	},
};

type RunOptions = {
	documentId?: string;
	query?: string;
	allowList?: TrustedDocumentAllowList<any>;
	context?: Record<string, any>;
	headers?: Record<string, string>;
};

/**
 * Drives the plugin the way Apollo does: `requestDidStart` first, then `didResolveOperation`
 * on whatever listener came back. Returns the mutated request so we can assert on the
 * document that would actually have been executed.
 */
const run = async ({ documentId, query, allowList, context = {}, headers = {} }: RunOptions) => {
	const headerMap = new HeaderMap();
	for (const [key, value] of Object.entries(headers)) headerMap.set(key, value);

	const request: any = {
		query,
		extensions: documentId ? { persistedQuery: { version: 1, sha256Hash: documentId } } : {},
		http: { headers: headerMap },
	};

	const plugin = trustedDocumentsPlugin<any>({ manifest, allowList });
	const listener = (await plugin.requestDidStart!({
		request,
		contextValue: context,
	} as any)) as GraphQLRequestListener<any> | void;

	let error: any;
	try {
		await listener?.didResolveOperation?.({
			request,
			contextValue: context,
			operationName: null,
		} as any);
	} catch (caught) {
		error = caught;
	}

	return { request, error };
};

const expectRejected = (error: any) => {
	expect(error).toBeDefined();
	expect(error.extensions?.code).toBe(TRUSTED_DOCUMENT_REJECTED);
	expect((error.extensions?.http as any)?.status).toBe(403);
};

describe('trustedDocumentsPlugin', () => {
	describe('resolving documents', () => {
		it('swaps a known document id for the operation body', async () => {
			const { request, error } = await run({ documentId: WEB_ID });

			expect(error).toBeUndefined();
			expect(request.query).toBe(WEB_QUERY);
		});

		it('strips the persistedQuery extension so Apollo does not re-hash the body', async () => {
			const { request } = await run({ documentId: WEB_ID });

			expect(request.extensions.persistedQuery).toBeUndefined();
		});

		it('rejects an unknown document id', async () => {
			const { error } = await run({ documentId: 'nope' });

			expectRejected(error);
			expect(error.message).toContain('nope');
		});

		it('rejects an unknown document id even when the allow list says true', async () => {
			// There's no body to run, so this can only ever be a rejection.
			const { error } = await run({ documentId: 'nope', allowList: true });

			expectRejected(error);
		});

		it('reads a document id from the documentId extension as well', async () => {
			const request: any = {
				extensions: { documentId: WEB_ID },
				http: { headers: new HeaderMap() },
			};

			const plugin = trustedDocumentsPlugin<any>({ manifest });
			await plugin.requestDidStart!({ request, contextValue: {} } as any);

			expect(request.query).toBe(WEB_QUERY);
		});
	});

	describe('raw queries', () => {
		it('rejects a raw query when no allow list is configured', async () => {
			const { error } = await run({ query: '{ tasks { id } }' });

			expectRejected(error);
		});

		it('rejects a raw query when enforcing against named lists', async () => {
			const { error } = await run({ query: '{ tasks { id } }', allowList: 'web' });

			expectRejected(error);
		});

		it('allows a raw query when the allow list resolves to true', async () => {
			const { request, error } = await run({ query: '{ tasks { id } }', allowList: true });

			expect(error).toBeUndefined();
			expect(request.query).toBe('{ tasks { id } }');
		});
	});

	describe('allow list selection', () => {
		it('defaults to the union of every list', async () => {
			expect((await run({ documentId: WEB_ID })).error).toBeUndefined();
			expect((await run({ documentId: MOBILE_ID })).error).toBeUndefined();
		});

		it('accepts a static list name', async () => {
			expect((await run({ documentId: WEB_ID, allowList: 'web' })).error).toBeUndefined();
			expectRejected((await run({ documentId: MOBILE_ID, allowList: 'web' })).error);
		});

		it('accepts an array of list names', async () => {
			expect(
				(await run({ documentId: MOBILE_ID, allowList: ['web', 'mobile'] })).error
			).toBeUndefined();
		});

		it('rejects everything when the allow list is false', async () => {
			expectRejected((await run({ documentId: WEB_ID, allowList: false })).error);
		});

		it('accepts a synchronous function', async () => {
			const allowList = ({ headers }: any) =>
				headers.get('x-client') === 'mobile' ? 'mobile' : 'web';

			expect(
				(await run({ documentId: MOBILE_ID, allowList, headers: { 'x-client': 'mobile' } })).error
			).toBeUndefined();
			expectRejected(
				(await run({ documentId: WEB_ID, allowList, headers: { 'x-client': 'mobile' } })).error
			);
		});

		it('accepts an async function and sees the authenticated context', async () => {
			const allowList = async ({ context }: any) =>
				context.user?.roles?.includes('MOBILE') ? 'mobile' : 'web';

			expect(
				(await run({ documentId: MOBILE_ID, allowList, context: { user: { roles: ['MOBILE'] } } }))
					.error
			).toBeUndefined();
		});

		it('passes the document id and headers to the function', async () => {
			let seen: any;
			const allowList = (params: any) => {
				seen = params;
				return true;
			};

			await run({ documentId: WEB_ID, allowList, headers: { 'x-client': 'web' } });

			expect(seen.documentId).toBe(WEB_ID);
			expect(seen.headers.get('x-client')).toBe('web');
		});

		it('rejects a magic-link authenticated web session asking for a mobile document', async () => {
			// The headline scenario: a valid token for one client must not unlock another
			// client's operations.
			const allowList = ({ context }: any) =>
				context.user?.roles?.includes('MOBILE') ? 'mobile' : 'web';

			expectRejected(
				(
					await run({
						documentId: MOBILE_ID,
						allowList,
						context: { user: { roles: ['WEB_PORTAL'] }, token: { sub: 'user-1' } },
					})
				).error
			);
		});
	});

	it('does not use the FORBIDDEN code, which auth would rewrite into a login redirect', async () => {
		const { error } = await run({ documentId: 'nope' });

		expect(error.extensions.code).not.toBe('FORBIDDEN');
	});
});
