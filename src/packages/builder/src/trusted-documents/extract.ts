import { createHash } from 'node:crypto';
import {
	DocumentNode,
	FragmentDefinitionNode,
	GraphQLSchema,
	Kind,
	OperationDefinitionNode,
	print,
	validate,
	visit,
} from 'graphql';
import { normaliseDocument } from '@exogee/graphweaver-apollo-client/normalise';

export type TrustedDocument = {
	/** The stable id clients send in place of the operation. */
	id: string;

	/** The printed, normalised operation, with every fragment it depends on. */
	body: string;

	operationName?: string;
	operationType: 'query' | 'mutation' | 'subscription';

	/** Where this came from, so build failures can point somewhere useful. */
	source: string;
};

export type ExtractedDocument = {
	document: DocumentNode;
	source: string;
};

export class TrustedDocumentError extends Error {}

/**
 * Print an operation the same way the client will, so both arrive at the same id.
 *
 * The implementation is shared with `@exogee/graphweaver-apollo-client` rather than duplicated -
 * if the two sides disagreed by so much as a newline, every id would differ and no client could
 * talk to the API. That module imports nothing but `graphql`.
 */
const normalise = (definitions: (OperationDefinitionNode | FragmentDefinitionNode)[]): string =>
	normaliseDocument({ kind: Kind.DOCUMENT, definitions });

export const hashDocument = (body: string) =>
	createHash('sha256').update(body, 'utf8').digest('hex');

/** Every fragment the operation uses, including fragments used by those fragments. */
const fragmentsFor = (
	operation: OperationDefinitionNode,
	fragments: Map<string, FragmentDefinitionNode>,
	source: string
): FragmentDefinitionNode[] => {
	const collected = new Map<string, FragmentDefinitionNode>();
	const queue: Array<OperationDefinitionNode | FragmentDefinitionNode> = [operation];

	while (queue.length) {
		const node = queue.shift()!;

		visit(node, {
			FragmentSpread(spread) {
				const name = spread.name.value;
				if (collected.has(name)) return;

				const fragment = fragments.get(name);
				if (!fragment) {
					throw new TrustedDocumentError(
						`${source}: operation "${operation.name?.value ?? '(anonymous)'}" uses fragment "${name}", which isn't defined in any of the files for this allow list.`
					);
				}

				collected.set(name, fragment);
				queue.push(fragment);
			},
		});
	}

	return [...collected.values()];
};

/**
 * Turn loaded documents into trusted documents: one entry per operation, each carrying the
 * fragments it needs, validated against the schema and keyed by a hash of its printed body.
 */
export type BuildOptions = {
	/**
	 * What to do with a document that doesn't validate against the schema.
	 *
	 * `throw` for anything the developer wrote: a typo should fail the build rather than quietly
	 * dropping an operation their app depends on.
	 *
	 * `skip` for the documents we generate for the Admin UI. That enumeration is a superset of
	 * what the Admin UI can actually send - it offers a create mutation for every entity, say,
	 * including read only ones that have none. If the schema has no such operation then the Admin
	 * UI can't send it either, so dropping it is right, and the schema is a better authority on
	 * that than trying to mirror the Admin UI's own conditions here.
	 */
	onInvalid?: 'throw' | 'skip';
};

export const buildTrustedDocuments = (
	extracted: ExtractedDocument[],
	schema?: GraphQLSchema,
	{ onInvalid = 'throw' }: BuildOptions = {}
): TrustedDocument[] => {
	const fragments = new Map<string, FragmentDefinitionNode>();
	const fragmentSources = new Map<string, string>();
	const operations: Array<{ operation: OperationDefinitionNode; source: string }> = [];

	for (const { document, source } of extracted) {
		for (const definition of document.definitions) {
			if (definition.kind === Kind.FRAGMENT_DEFINITION) {
				const name = definition.name.value;
				const existing = fragments.get(name);

				// Two different fragments under one name would make the document that spreads them
				// ambiguous, so refuse rather than silently picking one.
				if (existing && print(existing) !== print(definition)) {
					throw new TrustedDocumentError(
						`Fragment "${name}" is defined twice with different contents, in ${fragmentSources.get(name)} and ${source}.`
					);
				}

				fragments.set(name, definition);
				fragmentSources.set(name, source);
			} else if (definition.kind === Kind.OPERATION_DEFINITION) {
				operations.push({ operation: definition, source });
			}
		}
	}

	const documents: TrustedDocument[] = [];
	const errors: string[] = [];
	const seen = new Map<string, string>();

	for (const { operation, source } of operations) {
		let document: DocumentNode;

		try {
			document = {
				kind: Kind.DOCUMENT,
				definitions: [operation, ...fragmentsFor(operation, fragments, source)],
			};
		} catch (error) {
			errors.push(error instanceof Error ? error.message : String(error));
			continue;
		}

		if (schema) {
			const validationErrors = validate(schema, document);

			if (validationErrors.length) {
				if (onInvalid === 'throw') {
					for (const validationError of validationErrors) {
						const line = validationError.locations?.[0]?.line;
						errors.push(`${source}${line ? `:${line}` : ''}: ${validationError.message}`);
					}
				}
				continue;
			}
		}

		const body = normalise(
			document.definitions as (OperationDefinitionNode | FragmentDefinitionNode)[]
		);
		const id = hashDocument(body);

		// The same operation written out twice hashes to the same id, which is harmless.
		const previous = seen.get(id);
		if (previous) continue;
		seen.set(id, source);

		documents.push({
			id,
			body,
			operationName: operation.name?.value,
			operationType: operation.operation,
			source,
		});
	}

	// Apollo's manifest tooling maps operation name -> id, so two documents sharing a name would
	// silently resolve to whichever was written last. Ours matches on the body and wouldn't care,
	// but a duplicate name is a bug in its own right - it makes logs ambiguous and breaks
	// graphql-codegen too - so refuse rather than emit a manifest that only half works.
	const sourcesByOperationName = new Map<string, string>();

	for (const document of documents) {
		if (!document.operationName) {
			// Only a problem for Apollo's tooling, which can't look up what it can't name. Ours is
			// keyed on the body, so this still works with the link we ship.
			console.warn(
				`${document.source}: this operation has no name, so it can't be looked up by name in the client manifest. Give it one if you want to use Apollo's persisted query tooling.`
			);
			continue;
		}

		const previous = sourcesByOperationName.get(document.operationName);

		if (previous) {
			errors.push(
				`Two different operations are both called "${document.operationName}", in ${previous} and ${document.source}. Operation names have to be unique within an allow list - rename one of them.`
			);
		} else {
			sourcesByOperationName.set(document.operationName, document.source);
		}
	}

	if (errors.length) {
		throw new TrustedDocumentError(
			`Found ${errors.length} problem${errors.length === 1 ? '' : 's'} with your trusted documents:\n\n  ${errors.join('\n  ')}\n`
		);
	}

	return documents;
};
