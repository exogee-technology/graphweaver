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

const getOperation = (operationTypeNode: OperationTypeNode, selectionNameValue: string) => {
	if (operationTypeNode === OperationTypeNode.QUERY) {
		return graphweaverMetadata.getAdditionalQueryByName(selectionNameValue);
	}

	if (operationTypeNode === OperationTypeNode.MUTATION) {
		return graphweaverMetadata.getAdditionalMutationByName(selectionNameValue);
	}

	return undefined;
};

const getVariables = (selection: SelectionNode, allVariables: VariableValues | undefined) => {
	if (!allVariables) return allVariables;

	const variables: VariableValues = {};

	if (selection.kind !== Kind.FIELD) return variables;

	const theArguments = selection.arguments;

	if (!theArguments) return {};

	theArguments.forEach((argument) => {
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
	queryLog: string;
	variablesLog: string;
}

export const getDidResolveOperationItemsToLog = (
	operation: OperationDefinitionNode,
	variables: VariableValues | undefined
): GetDidResolveOperationItemsToLogResultItem[] => {
	const allSelections = operation.selectionSet.selections;
	const operationTypeNode = operation.operation;

	const result: GetDidResolveOperationItemsToLogResultItem[] = [];

	allSelections.forEach((selection) => {
		const selectionNameValue = selection.kind === Kind.FIELD ? selection.name.value : undefined;

		if (!selectionNameValue) return;

		const additionalOperation = getOperation(operationTypeNode, selectionNameValue);

		const ast = {
			...operation,
			selectionSet: {
				...operation.selectionSet,
				selections: [selection],
			},
		};
		if (additionalOperation?.logOnDidResolveOperation) {
			const resultToLog = additionalOperation.logOnDidResolveOperation?.({
				query: print(ast),
				variables: getVariables(selection, variables),
			});
			result.push({
				queryLog: resultToLog.query,
				variablesLog: JSON.stringify(resultToLog.variables),
			});
		} else {
			result.push({
				queryLog: stripIgnoredCharacters(print(ast)),
				variablesLog: JSON.stringify(getVariables(selection, variables)),
			});
		}
	});

	return result;
};
