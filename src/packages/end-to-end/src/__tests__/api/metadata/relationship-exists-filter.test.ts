import { describe, test } from 'node:test';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	BaseDataProvider,
	Entity,
	Field,
	ID,
	RelationshipField,
	type BackendProviderConfig,
} from '@exogee/graphweaver';

/**
 * `{ books_exists: false }` asks whether a relationship has any rows at all. The rest of the filter
 * grammar cannot: `_not: { books: {} }` says it, but `cleanFilter` strips empty filter objects
 * before a provider sees one, so through the API that condition disappears and every row matches.
 *
 * Whether the operator *works* is covered per dialect against a real database. What is only
 * testable here is whether it appears in the schema at all, because that decision is core's and it
 * has to say no in two cases -- a provider that cannot answer it, and a relationship whose other
 * half lives in a different data source.
 */
describe('Relationship _exists filter', () => {
	class Provider extends BaseDataProvider<any> {
		constructor(
			backendId: string,
			public backendProviderConfig: BackendProviderConfig
		) {
			super(backendId);
		}

		async find() {
			return [];
		}
	}

	const supports = (backendId: string) =>
		new Provider(backendId, { filter: true, supportsRelationshipExistsFilter: true });

	@Entity('ExistsLibrary', { provider: supports('exists-local') })
	class Library {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		@RelationshipField<Book>(() => [Book], { relatedField: 'library' })
		books!: Book[];

		@Field(() => String, { nullable: true })
		curatorId?: string;

		@RelationshipField<Library>(() => Curator, { id: 'curatorId', nullable: true })
		curator?: Curator;

		// Same data source, but the other end cannot answer anything -- which does not matter,
		// because the EXISTS is compiled by this entity's provider, not that one.
		@RelationshipField<Remote>(() => [Remote], { relatedField: 'library' })
		remotes!: Remote[];
	}

	@Entity('ExistsBook', { provider: supports('exists-local') })
	class Book {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		@Field(() => String)
		libraryId!: string;

		@RelationshipField<Book>(() => Library, { id: 'libraryId' })
		library!: Library;
	}

	@Entity('ExistsCurator', { provider: supports('exists-local') })
	class Curator {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		// A primary key alone is not enough to build an insert input from, and the schema has to
		// build before anything here can be asked about it.
		@Field(() => String)
		name!: string;
	}

	// Declares support, but lives somewhere else.
	@Entity('ExistsRemote', { provider: supports('exists-elsewhere') })
	class Remote {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		@Field(() => String)
		libraryId!: string;

		@RelationshipField<Remote>(() => Library, { id: 'libraryId' })
		library!: Library;
	}

	// Same data source as its relationships, but the provider never claimed to understand this.
	@Entity('ExistsArchive', { provider: new Provider('exists-local', { filter: true }) })
	class Archive {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		@RelationshipField<Book>(() => [Book], { relatedField: 'library' })
		books!: Book[];
	}

	void Archive;

	const graphweaver = new Graphweaver();

	const inputFieldsFor = async (typeName: string) => {
		const response = await graphweaver.executeOperation<{
			__type: { inputFields: { name: string; type: { name: string | null } }[] };
		}>({
			query: gql`
				query InputFields($name: String!) {
					__type(name: $name) {
						inputFields {
							name
							type {
								name
							}
						}
					}
				}
			`,
			variables: { name: typeName },
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		return response.body.singleResult.data!.__type.inputFields;
	};

	test('is offered on every relationship kind when the provider supports it', async () => {
		const fields = await inputFieldsFor('ExistsLibrariesListFilter');
		const names = fields.map((field) => field.name);

		expect(names).toContain('books_exists');
		expect(names).toContain('curator_exists');

		// A Boolean, not a filter input. That is what lets it survive `cleanFilter`, which drops
		// empty objects but keeps primitives -- the whole reason this operator exists.
		expect(fields.find((field) => field.name === 'books_exists')?.type.name).toBe('Boolean');

		// The relationship itself is still filterable in the ordinary way.
		expect(names).toContain('books');
		expect(names).toContain('curator');
	});

	test('is not offered when the relationship crosses data sources', async () => {
		// Nothing here could answer it: this entity's provider cannot see the other table, and
		// unlike a nested filter there are no ids for the query manager to flatten it into.
		const names = (await inputFieldsFor('ExistsLibrariesListFilter')).map((field) => field.name);

		expect(names).toContain('remotes');
		expect(names).not.toContain('remotes_exists');
	});

	test('is not offered when the provider has not declared support', async () => {
		// A provider that silently ignored the filter would return every row rather than failing,
		// so the operator has to be opt in rather than assumed.
		const names = (await inputFieldsFor('ExistsArchivesListFilter')).map((field) => field.name);

		expect(names).toContain('books');
		expect(names).not.toContain('books_exists');
	});

	test('is rejected by validation where it is not offered', async () => {
		const response = await graphweaver.executeOperation({
			query: gql`
				query {
					existsArchives(filter: { books_exists: false }) {
						id
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors?.[0].message).toContain(
			'Field "books_exists" is not defined by type "ExistsArchivesListFilter"'
		);
	});
});
