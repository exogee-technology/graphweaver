import { describe, it, expect } from 'vitest';
import { parse, print, visit } from 'graphql';
import * as documents from '@exogee/graphweaver-admin-ui-components/documents';
import { enumerateAdminUiDocuments } from '@exogee/graphweaver-admin-ui-components/documents';

import { buildTrustedDocuments } from './extract';

/**
 * Every document generator the Admin UI exports, and how the enumeration covers it.
 *
 * `covered` entries are invoked here with the test metadata and their output must appear in
 * `enumerateAdminUiDocuments`. `excluded` entries carry the reason they're not a trusted
 * document. Every export has to appear in one list or the other, so adding a generator without
 * enumerating it fails this test rather than silently shipping a safelist the Admin UI
 * breaks against.
 */
type Coverage = { covered: (context: Context) => unknown } | { excluded: string };

type Context = {
	entity: any;
	entityByType: (type: string) => any;
};

const COVERAGE: Record<string, Coverage> = {
	SCHEMA_QUERY: { covered: () => documents.SCHEMA_QUERY },
	TENANTS_QUERY: { covered: () => documents.TENANTS_QUERY },
	getUploadUrlMutation: { covered: () => documents.getUploadUrlMutation },
	getDeleteUrlMutation: { covered: () => documents.getDeleteUrlMutation },

	queryForEntityPage: {
		covered: ({ entity, entityByType }) => documents.queryForEntityPage(entity.name, entityByType),
	},
	queryForEntityEdit: {
		covered: ({ entity, entityByType }) => documents.queryForEntityEdit(entity, entityByType),
	},
	listEntityForExport: {
		covered: ({ entity, entityByType }) => documents.listEntityForExport(entity, entityByType),
	},
	generateCreateEntityMutation: {
		covered: ({ entity, entityByType }) =>
			documents.generateCreateEntityMutation(entity, entityByType),
	},
	generateUpdateEntityMutation: {
		covered: ({ entity, entityByType }) =>
			documents.generateUpdateEntityMutation(entity, entityByType),
	},
	generateDeleteEntityMutation: {
		covered: ({ entity }) => documents.generateDeleteEntityMutation(entity),
	},
	generateDeleteManyEntitiesMutation: {
		covered: ({ entity }) => documents.generateDeleteManyEntitiesMutation(entity),
	},
	getRelationshipQuery: {
		// Both the detail panel and the filter bar export one of these, with different
		// signatures. Both are enumerated.
		covered: ({ entity }) => documents.getRelationshipQuery(entity),
	},
	getRelationshipCountQuery: {
		covered: ({ entity }) => documents.getRelationshipCountQuery(entity),
	},
	getFilterOptionsQuery: {
		covered: ({ entity }) => documents.filterDocuments.getFilterOptionsQuery(entity, 'name'),
	},

	fragmentForDisplayValueOfEntity: {
		excluded:
			'only handed to apolloClient.readFragment for a local cache read, never sent to the server',
	},
	generateGqlSelectForEntityFields: { excluded: 'a selection set builder, not a document' },
	getEntityListQueryName: { excluded: 'returns a name, not a document' },
	enumerateAdminUiDocuments: { excluded: 'the enumeration itself' },
};

const entity = (name: string, plural: string, fields: any[], extra: any = {}) => ({
	name,
	plural,
	primaryKeyField: 'id',
	summaryField: 'name',
	fieldForDetailPanelNavigationId: 'id',
	supportedAggregationTypes: ['COUNT'],
	supportsPseudoCursorPagination: true,
	hideInSideBar: false,
	attributes: {},
	fields,
	...extra,
});

const metadata = {
	enums: [],
	entities: [
		entity('Task', 'Tasks', [
			{ name: 'id', type: 'ID!' },
			{ name: 'name', type: 'String' },
			{ name: 'tags', type: 'Tag', relationshipType: 'MANY_TO_MANY' },
		]),
		entity('Tag', 'Tags', [
			{ name: 'id', type: 'ID!' },
			{ name: 'name', type: 'String' },
		]),
	],
};

describe('Admin UI document enumeration', () => {
	it('accounts for every export, as either covered or deliberately excluded', () => {
		const exported = Object.keys(documents)
			.filter((name) => name !== 'filterDocuments')
			.concat(Object.keys(documents.filterDocuments).map((name) => `filterDocuments.${name}`));

		const unaccounted = exported.filter((name) => !COVERAGE[name.replace('filterDocuments.', '')]);

		expect(unaccounted).toEqual([]);
	});

	it('enumerates the output of every covered generator', () => {
		const entityByType = (type: string) =>
			metadata.entities.find((candidate) => candidate.name === type)!;
		const context = { entity: metadata.entities[0], entityByType };

		const enumerated = new Set(
			enumerateAdminUiDocuments(metadata as any).map(({ document }) => print(document))
		);

		const missing = Object.entries(COVERAGE)
			.filter(([, coverage]) => 'covered' in coverage)
			.filter(([, coverage]) => {
				const document = (coverage as any).covered(context);
				return document && !enumerated.has(print(document));
			})
			.map(([name]) => name);

		expect(missing).toEqual([]);
	});

	it('produces a document for every entity operation', () => {
		const enumerated = enumerateAdminUiDocuments(metadata as any);
		const sources = enumerated.map((d) => d.source);

		for (const what of [
			'list',
			'detail',
			'csv export',
			'create',
			'update',
			'delete',
			'delete many',
			'relationship',
			'relationship count',
			'filter relationship',
		]) {
			expect(sources).toContain(`admin-ui: Task ${what}`);
		}
	});

	it('produces filter option queries per filterable field', () => {
		const sources = enumerateAdminUiDocuments(metadata as any).map((d) => d.source);

		expect(sources).toContain('admin-ui: Task filter options for name');
		expect(sources).toContain('admin-ui: Tag filter options for name');
	});

	it('skips fields hidden from the filter bar', () => {
		const hidden = {
			enums: [],
			entities: [
				entity('Task', 'Tasks', [
					{ name: 'id', type: 'ID!' },
					{ name: 'secret', type: 'String', hideInFilterBar: true },
				]),
			],
		};

		const sources = enumerateAdminUiDocuments(hidden as any).map((d) => d.source);

		expect(sources).not.toContain('admin-ui: Task filter options for secret');
	});

	it('skips views it cannot generate rather than failing the build', () => {
		// `tags` points at an entity that isn't in the metadata, so the list and detail views
		// can't be built. The Admin UI can't render them either, so we carry on.
		const dangling = {
			enums: [],
			entities: [
				entity('Task', 'Tasks', [
					{ name: 'id', type: 'ID!' },
					{ name: 'tags', type: 'Missing', relationshipType: 'MANY_TO_MANY' },
				]),
			],
		};

		expect(() => enumerateAdminUiDocuments(dangling as any)).not.toThrow();
		expect(enumerateAdminUiDocuments(dangling as any).length).toBeGreaterThan(0);
	});

	it('hashes into a usable allow list', () => {
		const enumerated = enumerateAdminUiDocuments(metadata as any);
		const trusted = buildTrustedDocuments(enumerated);

		expect(trusted.length).toBeGreaterThan(20);
		expect(new Set(trusted.map((d) => d.id)).size).toBe(trusted.length);
	});

	/**
	 * The Admin UI is an Apollo client, so every document it sends carries `__typename` whether the
	 * generator wrote one or not. Safelisting only the documents as generated would mean an Admin UI
	 * that cannot load a single page against its own API, which is exactly what used to happen.
	 */
	it('safelists the Admin UI documents as its Apollo client will send them', () => {
		// Apollo has nothing to add to an operation whose only selection set is the root one, so the
		// documents to check are those selecting fields on something.
		const selectsFieldsOnSomething = (body: string) => {
			let nested = false;
			visit(parse(body), {
				Field: (field) => {
					if (field.selectionSet) nested = true;
				},
			});
			return nested;
		};

		const trusted = buildTrustedDocuments(enumerateAdminUiDocuments(metadata as any));
		const selectsNestedFields = trusted.filter((document) =>
			selectsFieldsOnSomething(document.body)
		);

		expect(selectsNestedFields.length).toBeGreaterThan(20);

		for (const document of selectsNestedFields) {
			expect(
				document.apollo,
				`${document.operationName ?? document.source} has no Apollo variant`
			).toBeDefined();
			expect(document.apollo!.body).toContain('__typename');
			expect(document.apollo!.id).not.toBe(document.id);
		}
	});
});
