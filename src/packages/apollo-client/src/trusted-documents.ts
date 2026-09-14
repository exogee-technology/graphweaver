import { ApolloLink } from '@apollo/client';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';

import { normaliseDocument } from './normalise';

/**
 * The same sha256 of the normalised document the build computes, done in the browser.
 *
 * `crypto.subtle` needs a secure context, which means https or localhost. Anywhere else this
 * throws, and the operation can't be sent as a trusted document.
 */
const hashInBrowser = async (body: string): Promise<string> => {
	if (!globalThis.crypto?.subtle) {
		throw new Error(
			'Trusted documents need crypto.subtle to hash operations, which browsers only expose over https or on localhost. Serve the app over https, or pass a manifest so no hashing is needed.'
		);
	}

	const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(body));

	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
};

export type TrustedDocumentsManifest = {
	operations: Array<{ id: string; name?: string | null; type?: string; body: string }>;
};

export type TrustedDocumentsLinkOptions = {
	/**
	 * One of the `*.persisted-query-manifest.json` files written by `graphweaver build`.
	 *
	 * Leave it out to hash each operation in the browser instead. That's what the Admin UI does,
	 * since it builds its documents at runtime from your schema and so has nothing to look up -
	 * the ids come out the same either way. Shipping a manifest lets you drop the operations from
	 * your bundle entirely, which is what you want for a public client.
	 */
	manifest?: TrustedDocumentsManifest;

	/**
	 * What to do when an operation isn't in the manifest. Throwing is the default and what you
	 * want in production - it's a build problem, and the server will reject the request anyway.
	 * `send-document` falls back to sending the whole query, which is handy while developing
	 * against a server that isn't enforcing yet.
	 */
	onUnknownDocument?: 'throw' | 'send-document';
};

/**
 * Sends a document id instead of the operation itself, for an API enforcing trusted documents.
 *
 * Put it directly in front of your HTTP link:
 *
 * ```ts
 * import manifest from './trusted-documents/web.persisted-query-manifest.json';
 *
 * new ApolloClient({
 *   link: ApolloLink.from([createTrustedDocumentsLink({ manifest }), httpLink]),
 *   cache: new InMemoryCache(),
 * });
 * ```
 */
export const createTrustedDocumentsLink = ({
	manifest,
	onUnknownDocument = 'throw',
}: TrustedDocumentsLinkOptions = {}): ApolloLink => {
	const idsByDocument = manifest
		? new Map(manifest.operations.map((operation) => [operation.body, operation.id]))
		: undefined;

	return createPersistedQueryLink({
		generateHash: async (document) => {
			const body = normaliseDocument(document);

			if (!idsByDocument) return hashInBrowser(body);

			const id = idsByDocument.get(body);

			if (id) return id;

			if (onUnknownDocument === 'throw') {
				throw new Error(
					'This operation is not in the trusted document manifest, so the server will reject it. Run `graphweaver build` and make sure the operation is in one of your allow list paths.'
				);
			}

			// Returning nothing makes the persisted query link send the document as normal.
			return '';
		},

		// We never want the "not found, retry with the full query" dance: the server rejects raw
		// queries while enforcing, so a retry would just fail a second time.
		disable: () => false,
	});
};
