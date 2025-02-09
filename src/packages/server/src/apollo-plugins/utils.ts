import { graphweaverMetadata } from '@exogee/graphweaver';
import {
	Kind,
	OperationDefinitionNode,
	OperationTypeNode,
	print,
	SelectionNode,
	stripIgnoredCharacters,
} from 'graphql';

/**
 * Tries to get as much info as possible from the query without revealing any sensitive data.
 * The purpose of this is to not log passwords or other sensitive data.
 * At the point when this function is called we don't have any parsing information, just a string.
 */
export const extractInitialQuerySegment = (query: string | undefined) => {
	const stripped = stripIgnoredCharacters(query ?? '');
	const safeToLog = stripped.split(':')[0];
	return safeToLog + (stripped.length > safeToLog.length ? '...' : '');
};

type VariableValues = {
	[name: string]: any;
};

const getEntityOperation = (operationTypeNode: OperationTypeNode, selectionNameValue: string) => {
	if (operationTypeNode === OperationTypeNode.QUERY) {
		return graphweaverMetadata.getAdditionalQueryByName(selectionNameValue);
	}

	if (operationTypeNode === OperationTypeNode.MUTATION) {
		return graphweaverMetadata.getAdditionalMutationByName(selectionNameValue);
	}

	return undefined;
};

/**
 * Given a AST node, returns the variables that are used in that node.
 * For example, if we have a query like:
 * query myQueryForBooksAndAuthors($bookIds: [ID!]!, $authorIds: [ID!]!) {
 *  books(ids: $bookIds) {
 * 		title
 * 	}
 * 	authors(ids: $authorIds) {
 * 		name
 * 	}
 * }
 * then we call this functions with the AST node for `books` then we should get the variables related to that entity, not to the `authors` entity.
 * So, if we have the variables being:
 * {
 * 	"bookIds": ["1", "2"],
 * 	"authorIds": ["3", "4"]
 * }
 * then we should get:
 * { "bookIds": ["1", "2"] }
 */
const extractVariablesFromSelection = (
	selection: SelectionNode,
	allVariables: VariableValues | undefined
) => {
	if (!allVariables) return allVariables;

	const variables: VariableValues = {};

	if (selection.kind !== Kind.FIELD) return variables;

	const selectionArguments = selection.arguments;

	if (!selectionArguments) return {};

	selectionArguments.forEach((argument) => {
		if (argument.value.kind === Kind.VARIABLE) {
			const key = argument.value.name.value;
			if (key in allVariables) {
				const value = allVariables[key];
				variables[key] = value;
			}
		}
	});

	return variables;
};

interface GetDidResolveOperationItemsToLogResultItem {
	query: string;
	variables: string;
}

export const getDidResolveOperationItemsToLog = (
	operation: OperationDefinitionNode,
	variables: VariableValues | undefined
): GetDidResolveOperationItemsToLogResultItem[] => {
	// each operation can have multiple selections, for example: query { books { title } authors { name } } => books and authors are selections
	const allSelections = operation.selectionSet.selections;
	// operationTypeNode is either QUERY or MUTATION
	const operationTypeNode = operation.operation;

	const result: GetDidResolveOperationItemsToLogResultItem[] = [];

	// for each selection, we get the entity operation and call the logOnDidResolveOperation function if it exists
	allSelections.forEach((selection) => {
		const selectionNameValue = selection.kind === Kind.FIELD ? selection.name.value : undefined;

		if (!selectionNameValue) return;

		const entityOperation = getEntityOperation(operationTypeNode, selectionNameValue);

		// build a new AST with only the current selection so we can call the logOnDidResolveOperation function (if any) for the relevant entity and with the relevant variables instead of calling that function with the whole operation and all variables.
		// that is, if we have `query { books { title } authors { name } }` and the books entity has a logOnDidResolveOperation function, we want to call that function with the query `query { books { title } }` and the relevant variables. Not with the whole operation and all variables.
		const ast = {
			...operation,
			selectionSet: {
				...operation.selectionSet,
				selections: [selection],
			},
		};
		if (entityOperation?.logOnDidResolveOperation) {
			const resultToLog = entityOperation.logOnDidResolveOperation?.({
				ast,
				variables: extractVariablesFromSelection(selection, variables),
			});
			result.push({
				query: resultToLog.query,
				variables: JSON.stringify(resultToLog.variables),
			});
		} else {
			// No custom logging function, just log the query and variables as is.
			result.push({
				query: stripIgnoredCharacters(print(ast)),
				variables: JSON.stringify(extractVariablesFromSelection(selection, variables)),
			});
		}
	});

	return result;
};
