import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildSchema } from 'graphql';

import { ADMIN_UI_ALLOW_LIST, generateTrustedDocuments, servesAdminUi } from './index';

/**
 * The generator reaches for the project's `graphweaver-config`, for the developer's own
 * documents on disk, and for the Admin UI's document generators. None of those exist here, so
 * all three are stubbed: what's under test is the decision about whether the Admin UI list
 * belongs in the manifest at all, not how any of them work.
 */
const state = vi.hoisted(() => ({ config: {} as any }));

vi.mock('@exogee/graphweaver-config', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	config: () => state.config,
}));

vi.mock('@graphql-tools/load', async () => {
	const { parse } = await import('graphql');

	return {
		loadDocuments: async (paths: string[]) =>
			paths.includes('web/**/*.graphql')
				? [{ location: 'web/tasks.graphql', document: parse('query Tasks { tasks { id } }') }]
				: [],
	};
});

vi.mock('@exogee/graphweaver-admin-ui-components/documents', async () => {
	const { parse } = await import('graphql');

	return {
		enumerateAdminUiDocuments: () => [
			{ document: parse('query AdminUiTasks { tasks { id } }'), source: 'admin-ui' },
		],
	};
});

const withAdminUi = buildSchema(`
	type Task { id: ID! }
	type AdminUiMetadata { entities: String }
	type Query { tasks: [Task!]!, _graphweaver: AdminUiMetadata! }
`);

const withoutAdminUi = buildSchema(`
	type Task { id: ID! }
	type Query { tasks: [Task!]! }
`);

const generate = (schema: typeof withAdminUi, includeAdminUi?: boolean) =>
	generateTrustedDocuments({
		schema,
		metadata: { entities: [{ name: 'Task' }] },
		includeAdminUi,
	});

describe('servesAdminUi', () => {
	it('is true when the schema has the metadata query the Admin UI needs', () => {
		expect(servesAdminUi(withAdminUi)).toBe(true);
	});

	it('is false when adminMetadata is turned off, so the query was never added', () => {
		expect(servesAdminUi(withoutAdminUi)).toBe(false);
	});

	it('is false when there is no schema to look at', () => {
		expect(servesAdminUi()).toBe(false);
	});
});

describe('the Admin UI allow list', () => {
	beforeEach(() => {
		state.config = {
			adminUI: {},
			trustedDocuments: { allowLists: { web: ['web/**/*.graphql'] } },
		};
	});

	it('is generated for projects that serve the Admin UI', async () => {
		const generated = await generate(withAdminUi);

		expect(Object.keys(generated!.allowLists)).toContain(ADMIN_UI_ALLOW_LIST);
		expect(generated!.allowLists[ADMIN_UI_ALLOW_LIST].map((d) => d.operationName)).toEqual([
			'AdminUiTasks',
		]);
	});

	it('is left out for projects that have turned the Admin UI off', async () => {
		const generated = await generate(withoutAdminUi);

		expect(Object.keys(generated!.allowLists)).not.toContain(ADMIN_UI_ALLOW_LIST);
	});

	it("doesn't take the project's own allow lists down with it", async () => {
		const generated = await generate(withoutAdminUi);

		expect(generated!.allowLists.web.map((d) => d.operationName)).toEqual(['Tasks']);
		expect(generated!.total).toBe(1);
	});

	it('can still be asked for explicitly', async () => {
		const generated = await generate(withoutAdminUi, true);

		expect(Object.keys(generated!.allowLists)).toContain(ADMIN_UI_ALLOW_LIST);
	});

	it('can still be opted out of explicitly', async () => {
		const generated = await generate(withAdminUi, false);

		expect(Object.keys(generated!.allowLists)).not.toContain(ADMIN_UI_ALLOW_LIST);
	});
});
