import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import { parse, print } from 'graphql';
import { ApolloClient, ApolloLink, InMemoryCache, Observable, gql } from '@apollo/client';
import { createPersistedQueryLink } from '@apollo/client/link/persisted-queries';
import { normaliseDocument } from '@exogee/graphweaver-apollo-client/normalise';

import { enumerateAdminUiDocuments } from '@exogee/graphweaver-admin-ui-components/documents';

import { buildTrustedDocuments, TrustedDocumentError } from './extract';

/** The id a client works out for an operation it is about to send, as written. */
const clientIdFor = (document: string) =>
	createHash('sha256')
		.update(normaliseDocument(parse(document)), 'utf8')
		.digest('hex');

/**
 * The build writes ids into the manifest; the client works out the id for the operation it's
 * about to send. If those two ever disagree, every request is rejected. These pin that contract.
 */
describe('build and client agree on document ids', () => {
	const clientId = (document: string) =>
		createHash('sha256')
			.update(normaliseDocument(parse(document)), 'utf8')
			.digest('hex');

	it('agrees for a plain operation', () => {
		const source = 'query Tasks { tasks { id description } }';
		const [built] = buildTrustedDocuments([{ document: parse(source), source: 'a.graphql' }]);

		expect(built.id).toBe(clientId(source));
	});

	it('agrees for an operation with fragments', () => {
		const source = `
			query Tasks { tasks { ...TaskFields } }
			fragment TaskFields on Task { id description }
		`;
		const [built] = buildTrustedDocuments([{ document: parse(source), source: 'a.graphql' }]);

		expect(built.id).toBe(clientId(source));
	});

	it('agrees even when the client writes the fragment first', () => {
		const built = buildTrustedDocuments([
			{
				document: parse('query Tasks { tasks { ...TaskFields } }'),
				source: 'a.graphql',
			},
			{ document: parse('fragment TaskFields on Task { id }'), source: 'b.graphql' },
		]);

		// The client's document has both, in the other order.
		expect(built[0].id).toBe(
			clientId('fragment TaskFields on Task { id }\nquery Tasks { tasks { ...TaskFields } }')
		);
	});

	it('agrees regardless of whitespace', () => {
		const [built] = buildTrustedDocuments([
			{ document: parse('query Tasks { tasks { id } }'), source: 'a.graphql' },
		]);

		expect(built.id).toBe(clientId('query    Tasks {\n\n  tasks {\n    id\n  }\n}\n'));
	});

	it('the manifest body is exactly what the client normalises to', () => {
		const source = 'query Tasks { tasks { ...F } } fragment F on Task { id }';
		const [built] = buildTrustedDocuments([{ document: parse(source), source: 'a.graphql' }]);

		expect(built.body).toBe(normaliseDocument(parse(source)));
	});
});

/**
 * Apollo's own `sortTopLevelDefinitions`, transcribed verbatim from
 * @apollo/persisted-query-lists 1.1.0, and its default `createOperationId`, which is a plain
 * sha256 of the printed body.
 *
 * Matching them byte for byte means the ids we bake into the manifest are the same ids Apollo's
 * tooling produces, so `generatePersistedQueryIdsAtRuntime` and the manifest verification link
 * work against a Graphweaver API without us shipping anything.
 */
const apolloSortTopLevelDefinitions = (query: any) => {
	const definitions = [...query.definitions];
	definitions.sort((a: any, b: any) => {
		if (a.kind > b.kind) return -1;
		if (a.kind < b.kind) return 1;
		const aName =
			a.kind === 'OperationDefinition' || a.kind === 'FragmentDefinition'
				? (a.name?.value ?? '')
				: '';
		const bName =
			b.kind === 'OperationDefinition' || b.kind === 'FragmentDefinition'
				? (b.name?.value ?? '')
				: '';
		if (aName < bName) return -1;
		if (aName > bName) return 1;
		return 0;
	});
	return { ...query, definitions };
};

describe('ids match what Apollo tooling produces', () => {
	const apolloId = (document: string) =>
		createHash('sha256')
			.update(print(apolloSortTopLevelDefinitions(parse(document))), 'utf8')
			.digest('hex');

	const cases: Array<[string, string]> = [
		['a plain operation', 'query Tasks { tasks { id } }'],
		[
			'an operation with one fragment',
			'query Tasks { tasks { ...TaskFields } } fragment TaskFields on Task { id }',
		],
		[
			'fragments that sort differently under localeCompare than by code unit',
			`query Tasks { tasks { ...apple ...Banana } }
			 fragment apple on Task { id }
			 fragment Banana on Task { description }`,
		],
		[
			'several fragments needing a stable order',
			`query Tasks { tasks { ...Zebra ...alpha ...Middle } }
			 fragment Zebra on Task { id }
			 fragment alpha on Task { description }
			 fragment Middle on Task { id }`,
		],
	];

	for (const [what, document] of cases) {
		it(`agrees on ${what}`, () => {
			const [built] = buildTrustedDocuments([{ document: parse(document), source: 'a.graphql' }]);

			expect(built.id).toBe(apolloId(document));
		});
	}
});

describe('manifests work with Apollo name-keyed lookup', () => {
	/**
	 * `generatePersistedQueryIdsFromManifest` from @apollo/persisted-query-lists 1.1.0 builds a
	 * Map of operation name -> id and looks the outgoing operation up by name. Two documents
	 * sharing a name would silently collapse to one, which is why we refuse to emit that.
	 */
	const apolloLookup = (operations: Array<{ name?: string; id: string }>) => {
		const byName = new Map<string, string>();
		for (const { name, id } of operations) byName.set(name!, id);
		return byName;
	};

	it('every document is reachable by its name', () => {
		const documents = buildTrustedDocuments([
			{ document: parse('query Tasks { tasks { id } }'), source: 'a.graphql' },
			{ document: parse('query Tags { tags { id } }'), source: 'b.graphql' },
			{ document: parse('mutation AddTask { addTask { id } }'), source: 'c.graphql' },
		]);

		const byName = apolloLookup(documents.map((d) => ({ name: d.operationName, id: d.id })));

		expect(byName.size).toBe(documents.length);
		for (const document of documents) {
			expect(byName.get(document.operationName!)).toBe(document.id);
		}
	});

	it('refuses two operations sharing a name, naming both files', () => {
		let error: any;
		try {
			buildTrustedDocuments([
				{ document: parse('query Tasks { tasks { id } }'), source: 'web/a.graphql' },
				{ document: parse('query Tasks { tasks { description } }'), source: 'web/b.graphql' },
			]);
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(TrustedDocumentError);
		expect(error.message).toContain('both called "Tasks"');
		expect(error.message).toContain('web/a.graphql');
		expect(error.message).toContain('web/b.graphql');
	});

	it('the same operation written twice is deduplicated, not treated as a clash', () => {
		const documents = buildTrustedDocuments([
			{ document: parse('query Tasks { tasks { id } }'), source: 'a.graphql' },
			{ document: parse('query Tasks { tasks { id } }'), source: 'b.graphql' },
		]);

		expect(documents).toHaveLength(1);
	});
});

describe('the generated Admin UI documents are Apollo compatible', () => {
	const entity = (name: string, plural: string) => ({
		name,
		plural,
		primaryKeyField: 'id',
		summaryField: 'name',
		fieldForDetailPanelNavigationId: 'id',
		supportedAggregationTypes: ['COUNT'],
		supportsPseudoCursorPagination: true,
		hideInSideBar: false,
		attributes: {},
		fields: [
			{ name: 'id', type: 'ID!' },
			{ name: 'name', type: 'String' },
			{ name: 'artist', type: 'Artist', relationshipType: 'MANY_TO_ONE' },
		],
	});

	const metadata = {
		enums: [],
		entities: [entity('Album', 'Albums'), entity('Artist', 'Artists'), entity('Track', 'Tracks')],
	};

	it('names every operation uniquely, across every entity', () => {
		// The generators used to hardcode names like `updateEntity`, so every entity produced a
		// document with the same name and the manifest was unusable by name.
		const documents = buildTrustedDocuments(enumerateAdminUiDocuments(metadata as any));
		const names = documents.map((d) => d.operationName);

		expect(new Set(names).size).toBe(names.length);
	});

	it('qualifies the names with the entity they belong to', () => {
		const names = buildTrustedDocuments(enumerateAdminUiDocuments(metadata as any)).map(
			(d) => d.operationName
		);

		expect(names).toContain('UpdateAlbum');
		expect(names).toContain('DeleteArtists');
		expect(names).toContain('TrackDetail');
		expect(names).toContain('AlbumFilterOptionsForName');
	});

	it('names every operation in PascalCase, the GraphQL convention', () => {
		// Worth pinning: the mutations used to be camelCase (`createEntity`), which left the
		// generated names inconsistent with the queries beside them and with codegen, which turns
		// operation names into type names.
		const names = buildTrustedDocuments(enumerateAdminUiDocuments(metadata as any)).map(
			(d) => d.operationName ?? ''
		);

		expect(names.filter((name) => !/^[A-Z]/.test(name))).toEqual([]);
	});

	it('gives every operation a name, so Apollo tooling can look it up', () => {
		const documents = buildTrustedDocuments(enumerateAdminUiDocuments(metadata as any));

		expect(documents.every((d) => Boolean(d.operationName))).toBe(true);
	});
});

/**
 * The contract that matters most, because it is the one that was wrong.
 *
 * Every id above is computed by hashing a document the way we believe a client will send it. That
 * belief is worth checking against the real thing: Apollo Client rewrites operations on their way
 * to the link chain, and an id hashed from the operation as written is not one any Apollo client
 * ever sends. Here the operation goes through an actual `ApolloClient`, and the id it puts in
 * `extensions.persistedQuery.sha256Hash` is the one the safelist has to contain.
 */
describe('an operation an Apollo client sends is in the safelist', () => {
	/** The id a real Apollo client would send for this operation, hashed the way our link does. */
	const idApolloWouldSend = async (source: string) => {
		let sent: string | undefined;

		const capture = new ApolloLink(
			(operation) =>
				new Observable<any>((observer) => {
					sent = operation.extensions?.persistedQuery?.sha256Hash;
					observer.next({ data: {} });
					observer.complete();
				})
		);

		const link = createPersistedQueryLink({
			generateHash: async (document) =>
				createHash('sha256').update(normaliseDocument(document), 'utf8').digest('hex'),
			disable: () => false,
		});

		const client = new ApolloClient({
			link: ApolloLink.from([link, capture]),
			cache: new InMemoryCache(),
		});

		const document = gql(source);
		const operation = document.definitions.find((d) => d.kind === 'OperationDefinition') as any;

		if (operation.operation === 'query') {
			await client.query({ query: document, fetchPolicy: 'no-cache' });
		} else {
			await client.mutate({ mutation: document, fetchPolicy: 'no-cache' });
		}

		return sent;
	};

	const idsFor = (source: string) => {
		const [built] = buildTrustedDocuments([{ document: parse(source), source: 'a.graphql' }]);
		return [built.id, built.apollo?.id].filter(Boolean);
	};

	const cases: Array<[string, string]> = [
		['a query selecting fields', 'query Tasks { tasks { id description } }'],
		[
			'a query with a fragment',
			'query Tasks { tasks { ...TaskFields } } fragment TaskFields on Task { id description }',
		],
		['a mutation selecting fields', 'mutation AddTask { addTask { id } }'],
		['nested selections', 'query Tasks { tasks { id tags { id name } } }'],
		['an operation that already asks for __typename', 'query Tasks { tasks { id __typename } }'],
	];

	for (const [what, source] of cases) {
		it(`covers ${what}`, async () => {
			const sent = await idApolloWouldSend(source);

			expect(sent).toBeDefined();
			expect(idsFor(source)).toContain(sent);
		});
	}

	it('still covers an operation with no nested selections, with a single entry', () => {
		const source = 'mutation DeleteTask($id: ID!) { deleteTask(id: $id) }';
		const [built] = buildTrustedDocuments([{ document: parse(source), source: 'a.graphql' }]);

		// Apollo has nothing to add to an operation whose only selection set is the root, so the two
		// variants would be the same document and we keep just the one.
		expect(built.apollo).toBeUndefined();
	});

	it('keeps the operation as written trusted too, for clients that send it that way', () => {
		const source = 'query Tasks { tasks { id } }';
		const [built] = buildTrustedDocuments([{ document: parse(source), source: 'a.graphql' }]);

		expect(built.id).toBe(clientIdFor(source));
		expect(built.apollo!.id).not.toBe(built.id);
		// The body follows its own id, so whichever the client asked for is what gets executed --
		// an Apollo client's cache needs the __typename it asked for to come back.
		expect(built.body).not.toContain('__typename');
		expect(built.apollo!.body).toContain('__typename');
	});
});
