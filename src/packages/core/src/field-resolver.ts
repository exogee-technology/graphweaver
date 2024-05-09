import { GraphQLArgument, GraphQLResolveInfo, Source } from 'graphql';
import { BaseContext } from './types';

const isObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value == 'object' && value !== null;
};

const isFunction = (
	property: unknown
): property is (
	source: Source,
	args: GraphQLArgument,
	context: BaseContext,
	info: GraphQLResolveInfo
) => unknown => {
	return typeof property === 'function';
};

export const fieldResolver = (
	source: Source,
	args: GraphQLArgument,
	context: BaseContext,
	info: GraphQLResolveInfo
) => {
	// ensure source is a value for which property access is acceptable.
	if (isObject(source) || typeof source === 'function') {
		const property = source[info.fieldName];

		if (isFunction(property)) {
			return property(source, args, context, info);
		}

		return property;
	}
};
