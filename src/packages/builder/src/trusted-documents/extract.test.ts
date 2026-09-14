import { describe, it, expect } from 'vitest';
import { buildSchema, parse as parseDocument } from 'graphql';

import { buildTrustedDocuments, hashDocument, TrustedDocumentError } from './extract';

const schema = buildSchema(`
	type Tag { id: ID!, name: String }
	type Task { id: ID!, description: String, tags: [Tag!]! }
	type Query { tasks: [Task!]!, tags: [Tag!]! }
`);

const doc = (source: string, location = 'test.graphql') => ({
	document: parseDocument(source),
	source: location,
});

describe('buildTrustedDocuments', () => {
	it('produces one entry per operation', () => {
		const documents = buildTrustedDocuments(
			[doc('query A { tasks { id } } query B { tags { id } }')],
			schema
		);

		expect(documents.map((d) => d.operationName).sort()).toEqual(['A', 'B']);
		expect(documents.every((d) => d.operationType === 'query')).toBe(true);
	});

	it('stitches in fragments defined in another file', () => {
		const documents = buildTrustedDocuments(
			[
				doc('query A { tasks { ...TaskFields } }', 'a.graphql'),
				doc('fragment TaskFields on Task { id description }', 'fragments.graphql'),
			],
			schema
		);

		expect(documents).toHaveLength(1);
		expect(documents[0].body).toContain('fragment TaskFields on Task');
	});

	it('follows fragments that spread other fragments', () => {
		const documents = buildTrustedDocuments(
			[
				doc('query A { tasks { ...TaskFields } }'),
				doc('fragment TaskFields on Task { id tags { ...TagFields } }'),
				doc('fragment TagFields on Tag { id name }'),
			],
			schema
		);

		expect(documents[0].body).toContain('fragment TagFields on Tag');
	});

	it('only includes the fragments an operation actually uses', () => {
		const documents = buildTrustedDocuments(
			[
				doc('query A { tasks { ...TaskFields } }'),
				doc('fragment TaskFields on Task { id }'),
				doc('fragment UnusedFields on Tag { id }'),
			],
			schema
		);

		expect(documents[0].body).toContain('TaskFields');
		expect(documents[0].body).not.toContain('UnusedFields');
	});

	it('hashes the same operation identically regardless of formatting', () => {
		const [tidy] = buildTrustedDocuments([doc('query A { tasks { id description } }')], schema);
		const [messy] = buildTrustedDocuments(
			[doc('query A {\n\n   tasks {\n  id\n\n     description\n   }\n}')],
			schema
		);

		expect(messy.id).toBe(tidy.id);
	});

	it('hashes the same operation identically regardless of fragment file order', () => {
		const fragment = doc('fragment TaskFields on Task { id description }');
		const operation = doc('query A { tasks { ...TaskFields } }');

		const [first] = buildTrustedDocuments([operation, fragment], schema);
		const [second] = buildTrustedDocuments([fragment, operation], schema);

		expect(second.id).toBe(first.id);
	});

	it('gives different operations different ids', () => {
		const documents = buildTrustedDocuments(
			[doc('query A { tasks { id } } query B { tasks { id description } }')],
			schema
		);

		expect(documents[0].id).not.toBe(documents[1].id);
	});

	it('ids are a sha256 of the body', () => {
		const [document] = buildTrustedDocuments([doc('query A { tasks { id } }')], schema);

		expect(document.id).toBe(hashDocument(document.body));
		expect(document.id).toMatch(/^[0-9a-f]{64}$/);
	});

	it('deduplicates an operation written out twice', () => {
		const documents = buildTrustedDocuments(
			[doc('query A { tasks { id } }', 'a.graphql'), doc('query A { tasks { id } }', 'b.graphql')],
			schema
		);

		expect(documents).toHaveLength(1);
	});

	describe('failures', () => {
		it('fails on a field that is not in the schema, naming the file and line', () => {
			let error: any;
			try {
				buildTrustedDocuments(
					[doc('query A {\n  tasks {\n    titel\n  }\n}', 'tasks.graphql')],
					schema
				);
			} catch (caught) {
				error = caught;
			}

			expect(error).toBeInstanceOf(TrustedDocumentError);
			expect(error.message).toContain('tasks.graphql:3');
			expect(error.message).toContain('titel');
		});

		it('reports every invalid document, not just the first', () => {
			let error: any;
			try {
				buildTrustedDocuments(
					[
						doc('query A { tasks { nope } }', 'a.graphql'),
						doc('query B { tags { nope } }', 'b.graphql'),
					],
					schema
				);
			} catch (caught) {
				error = caught;
			}

			expect(error.message).toContain('a.graphql');
			expect(error.message).toContain('b.graphql');
			expect(error.message).toContain('2 problems');
		});

		it('fails when a fragment is missing', () => {
			expect(() =>
				buildTrustedDocuments([doc('query A { tasks { ...Missing } }', 'a.graphql')], schema)
			).toThrow(/fragment "Missing"/i);
		});

		it('fails when one fragment name has two different definitions', () => {
			expect(() =>
				buildTrustedDocuments(
					[
						doc('fragment TaskFields on Task { id }', 'a.graphql'),
						doc('fragment TaskFields on Task { description }', 'b.graphql'),
						doc('query A { tasks { ...TaskFields } }'),
					],
					schema
				)
			).toThrow(/defined twice/i);
		});

		it('skips schema validation when no schema is given', () => {
			const documents = buildTrustedDocuments([doc('query A { whatever { id } }')]);

			expect(documents).toHaveLength(1);
		});
	});
});
