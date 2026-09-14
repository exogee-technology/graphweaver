import {
	DocumentNode,
	FragmentDefinitionNode,
	Kind,
	OperationDefinitionNode,
	print,
} from 'graphql';

/**
 * How a trusted document is turned into the string we hash to get its id.
 *
 * This is the contract between the build, which writes the manifest, and the client, which has
 * to arrive at the same id for the same operation. Both sides call this, so keep it here rather
 * than reimplementing it - the only import is `graphql`, so it's safe in a browser and in Node.
 *
 * Definitions are sorted (operations first, then fragments, each by name) so an operation prints
 * identically no matter which file its fragments lived in or what order they were loaded in.
 * Whitespace is normalised by `print`.
 *
 * The comparison deliberately matches `sortTopLevelDefinitions` in
 * `@apollo/persisted-query-lists` byte for byte - descending by node kind, which puts
 * OperationDefinition before FragmentDefinition, then ascending by name using code unit order.
 * Apollo hashes the result the same way we do, so ids we generate are the same ids their tooling
 * generates. Note `localeCompare` is NOT interchangeable here: it orders mixed case names
 * differently ("apple" before "Banana", where code units put "Banana" first), which would change
 * the printed body and so the id.
 */
export const normaliseDocument = (document: DocumentNode): string => {
	const definitions = document.definitions.filter(
		(definition): definition is OperationDefinitionNode | FragmentDefinitionNode =>
			definition.kind === Kind.OPERATION_DEFINITION || definition.kind === Kind.FRAGMENT_DEFINITION
	);

	return print({
		kind: Kind.DOCUMENT,
		definitions: [...definitions].sort((a, b) => {
			if (a.kind > b.kind) return -1;
			if (a.kind < b.kind) return 1;

			const aName = a.name?.value ?? '';
			const bName = b.name?.value ?? '';

			if (aName < bName) return -1;
			if (aName > bName) return 1;

			return 0;
		}),
	});
};
