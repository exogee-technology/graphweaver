import { GraphQLArgument, GraphQLResolveInfo, Source } from 'graphql';
import { BaseContext, TraceOptions } from './types';
import { trace } from './open-telemetry';

const isObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value == 'object' && value !== null;
};

export const fieldResolver = async (
	source: Source,
	args: GraphQLArgument,
	context: BaseContext,
	info: GraphQLResolveInfo
) => {
	// ensure source is a value for which property access is acceptable.
	if (isObject(source) || typeof source === 'function') {
		const property = source[info.fieldName];

		const parent = info.parentType.name;
		const key = info.fieldName;
		const metadata = (info.parentType.extensions.graphweaverSchemaInfo as any)?.sourceEntity;
		if (!metadata) throw new Error(`Could not locate metadata for the '${parent}' entity`);

		if (typeof property === 'function') {
			const res = await trace(async (trace?: TraceOptions) => {
				trace?.span.updateName(`FieldResolver - ${parent}.${key} - Function`);
				return property(source, args, context, info);
			})();
			return res;
		}

		return property;
	}
};
