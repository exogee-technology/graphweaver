import { describe, test } from 'node:test';
import gql from 'graphql-tag';
import assert from 'assert';
import Graphweaver from '@exogee/graphweaver-server';
import {
	BaseDataProvider,
	Entity,
	Field,
	ID,
	RELATED_ID_KEYS,
	RelationshipField,
} from '@exogee/graphweaver';

// A provider can tell the dataloader which related ids each record belongs to, instead of
// hydrating record[relatedField] purely so the loader can read the key back out of it.
describe('findByRelatedId with RELATED_ID_KEYS', () => {
	class AuthorRow {
		id!: string;
		name!: string;
	}

	class BookRow {
		id!: string;
		title!: string;
		authorId!: string;
	}

	const authorRows: AuthorRow[] = [
		{ id: '1', name: 'Ursula' },
		{ id: '2', name: 'Octavia' },
	];

	const bookRows: BookRow[] = [
		{ id: '10', title: 'A Wizard of Earthsea', authorId: '1' },
		{ id: '11', title: 'The Dispossessed', authorId: '1' },
		{ id: '12', title: 'Kindred', authorId: '2' },
	];

	class AuthorProvider extends BaseDataProvider<AuthorRow> {
		public entityType = AuthorRow;

		async find() {
			return authorRows;
		}
	}

	class BookProvider extends BaseDataProvider<BookRow> {
		public entityType = BookRow;

		async findByRelatedId(
			_entity: unknown,
			_relatedField: string,
			relatedIds: readonly string[]
		): Promise<BookRow[]> {
			// Note what is NOT here: we never set `book.author`. The relationship is left entirely
			// unhydrated, and the keys are handed to the loader out of band instead.
			return bookRows
				.filter((book) => relatedIds.includes(book.authorId))
				.map((book) => ({ ...book, [RELATED_ID_KEYS]: [book.authorId] }));
		}
	}

	@Entity('RelatedKeysAuthor', { provider: new AuthorProvider('related-keys-authors') })
	class Author {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		@Field(() => String)
		name!: string;

		@RelationshipField<Book>(() => [Book], { relatedField: 'author' })
		books!: Book[];
	}

	@Entity('RelatedKeysBook', { provider: new BookProvider('related-keys-books') })
	class Book {
		@Field(() => ID, { primaryKeyField: true })
		id!: string;

		@Field(() => String)
		title!: string;

		@RelationshipField<BookRow>(() => Author, { id: (row) => row.authorId })
		author!: Author;
	}

	const graphweaver = new Graphweaver();

	type Result = {
		relatedKeysAuthors: {
			id: string;
			name: string;
			books: { id: string; title: string; author: { id: string; name: string } }[];
		}[];
	};

	test('groups records by the keys the provider supplied, with no relationship hydration', async () => {
		const response = await graphweaver.executeOperation<Result>({
			query: gql`
				query {
					relatedKeysAuthors {
						id
						name
						books {
							id
							title
							author {
								id
								name
							}
						}
					}
				}
			`,
		});

		assert(response.body.kind === 'single');
		expect(response.body.singleResult.errors).toBeUndefined();

		const authors = response.body.singleResult.data?.relatedKeysAuthors;
		expect(authors).toHaveLength(2);

		expect(authors?.[0]).toMatchObject({
			id: '1',
			name: 'Ursula',
			books: [
				{ id: '10', title: 'A Wizard of Earthsea' },
				{ id: '11', title: 'The Dispossessed' },
			],
		});

		expect(authors?.[1]).toMatchObject({
			id: '2',
			name: 'Octavia',
			books: [{ id: '12', title: 'Kindred' }],
		});

		// The nested author still resolves, and it has to have come back through the dataloader
		// rather than off a pre-hydrated stub, because the provider never populated `book.author`.
		// This is the path that access control filters run on.
		expect(authors?.[0]?.books?.[0]?.author).toEqual({ id: '1', name: 'Ursula' });
		expect(authors?.[1]?.books?.[0]?.author).toEqual({ id: '2', name: 'Octavia' });
	});
});
