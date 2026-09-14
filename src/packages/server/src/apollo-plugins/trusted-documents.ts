import {
	ApolloServerPlugin,
	BaseContext,
	GraphQLRequest,
	GraphQLRequestListener,
	HeaderMap,
} from '@apollo/server';
import { GraphQLError } from 'graphql';
import { logger } from '@exogee/logger';

import {
	TrustedDocumentAllowListValue,
	TrustedDocumentManifestEntry,
	TrustedDocumentOptions,
} from '../config';

/**
 * The error code we reject with. Deliberately not `FORBIDDEN`: the auth plugin's
 * `willSendResponse` intercepts that code and rewrites the response into a 200 with a login
 * redirect, which would hide the rejection from the client entirely.
 */
export const TRUSTED_DOCUMENT_REJECTED = 'TRUSTED_DOCUMENT_REJECTED';

/**
 * Substituted in when we already know we're going to reject the request.
 *
 * Apollo gives us no way to bail out of a request from `requestDidStart` - anything thrown
 * there is caught by `internalExecuteOperation` and reported to the client as an opaque
 * "Internal server error" 500. Throws from `didResolveOperation`, on the other hand, are
 * turned into a proper GraphQL error response. So when we can't resolve a document we let
 * Apollo parse this trivial stand-in and then throw once we reach `didResolveOperation`.
 *
 * It's a single field at depth one, so it validates against any schema and sails past the
 * GraphQL Armor limits.
 */
const REJECTION_SENTINEL = 'query __graphweaverTrustedDocumentRejected { __typename }';

const EMPTY_HEADERS = new HeaderMap();

const reject = (message: string) =>
	new GraphQLError(message, {
		extensions: { code: TRUSTED_DOCUMENT_REJECTED, http: { status: 403 } },
	});

/**
 * We accept both the shape Apollo Client's persisted query link sends and a plain `documentId`,
 * so either kind of client works untouched.
 *
 * Both have to arrive under `extensions`. Apollo builds its request from `query`,
 * `operationName`, `variables` and `extensions` only, so a `documentId` sent at the top level of
 * the POST body - the graphql-over-http spelling - is dropped before any plugin sees it.
 */
const documentIdFrom = (request: GraphQLRequest): string | undefined => {
	const extensions = request.extensions as Record<string, any> | undefined;

	return extensions?.persistedQuery?.sha256Hash ?? extensions?.documentId;
};

const allowListNames = (value: TrustedDocumentAllowListValue): string[] =>
	typeof value === 'string' ? [value] : Array.isArray(value) ? value : [];

export const trustedDocumentsPlugin = <TContext extends BaseContext>(
	options: TrustedDocumentOptions<TContext>
): ApolloServerPlugin<TContext> => {
	const { manifest, allowList } = options;

	// Flatten the manifest once at startup so resolving a request is a couple of map hits
	// rather than a scan of every list.
	const documentsById = new Map<string, TrustedDocumentManifestEntry>();
	const listsByDocumentId = new Map<string, Set<string>>();

	for (const [listName, documents] of Object.entries(manifest?.allowLists ?? {})) {
		for (const [documentId, entry] of Object.entries(documents)) {
			documentsById.set(documentId, entry);

			let lists = listsByDocumentId.get(documentId);
			if (!lists) {
				lists = new Set();
				listsByDocumentId.set(documentId, lists);
			}
			lists.add(listName);
		}
	}

	logger.trace(
		`Trusted documents enabled with ${documentsById.size} document(s) across ${
			Object.keys(manifest?.allowLists ?? {}).length
		} allow list(s).`
	);

	return {
		async requestDidStart(requestContext): Promise<GraphQLRequestListener<TContext> | void> {
			const { request } = requestContext;
			const documentId = documentIdFrom(request);

			// Phase two. Authentication resolves inside other plugins' `requestDidStart` bodies,
			// and Apollo invokes all of those concurrently, so we can't read the authenticated
			// context above. By `didResolveOperation` every `requestDidStart` has settled.
			const authorize: GraphQLRequestListener<TContext>['didResolveOperation'] = async ({
				contextValue,
				operationName,
			}) => {
				const selected =
					typeof allowList === 'function'
						? await allowList({
								documentId,
								operationName,
								context: contextValue,
								headers: request.http?.headers ?? EMPTY_HEADERS,
								request,
							})
						: allowList;

				if (selected === false) {
					throw reject('This client is not permitted to make requests to this API.');
				}

				// `true` means skip enforcement, so an ad hoc query is fine here.
				if (selected === true) return;

				if (!documentId) {
					throw reject(
						'This API only accepts trusted documents. Send a document id rather than a query.'
					);
				}

				// No allow list configured at all means plain safelisting: any document in the
				// manifest is acceptable, which we already confirmed when we resolved it.
				if (selected === undefined) return;

				const permitted = allowListNames(selected);
				const belongsTo = listsByDocumentId.get(documentId);

				if (!permitted.some((name) => belongsTo?.has(name))) {
					logger.trace(
						`Rejecting document ${documentId}: it is in [${[...(belongsTo ?? [])].join(
							', '
						)}] but this request may only use [${permitted.join(', ')}].`
					);

					throw reject('This client is not permitted to send this document.');
				}
			};

			if (documentId) {
				const entry = documentsById.get(documentId);

				if (!entry) {
					// There's no body to run, so this is a rejection however the allow list resolves.
					request.query = REJECTION_SENTINEL;
					delete (request.extensions as Record<string, any> | undefined)?.persistedQuery;

					return {
						async didResolveOperation() {
							throw reject(`Unknown document id "${documentId.slice(0, 64)}".`);
						},
					};
				}

				request.query = entry.body;

				// Stop Apollo running its own automatic persisted query handling over the top of
				// ours. It would otherwise re-hash the body with its own algorithm and reject the
				// request when that doesn't match the id we were given.
				delete (request.extensions as Record<string, any> | undefined)?.persistedQuery;
			}

			// No document id and no query at all is Apollo's error to report, not ours.
			return { didResolveOperation: authorize };
		},
	};
};
