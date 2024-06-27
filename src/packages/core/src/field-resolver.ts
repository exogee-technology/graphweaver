import { GraphQLArgument, GraphQLResolveInfo, Source } from 'graphql';
import { BaseContext, TraceOptions } from './types';
import {
	getFieldTypeWithMetadata,
	graphweaverMetadata,
	isEntityMetadata,
	isSerializableGraphQLEntityClass,
} from '.';
import { trace } from './open-telemetry';
import { dataEntityForGraphQLEntity } from './default-from-backend-entity';

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
		const metadata = graphweaverMetadata.getEntityByName(parent);
		if (!metadata) throw new Error(`Could not locate metadata for the '${parent}' entity`);

		const relationship = metadata.fields[key];

		const { fieldType } = getFieldTypeWithMetadata(relationship.getType);
		const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);

		if (isEntityMetadata(fieldTypeMetadata) && isSerializableGraphQLEntityClass(fieldType)) {
			const res = await trace(async (trace?: TraceOptions) => {
				trace?.span.updateName(`FieldResolver - ${parent}.${key} - SerializableEntity`);
				return fieldType.deserialize({
					// Yes, this is a lot of `as any`, but we know this is a GraphQLEntity and it will have come from
					// our fromBackendEntity function, so we can go right to the data entity and pull out the appropriate
					// field to pass through here.
					value: (dataEntityForGraphQLEntity(source as any) as any)[info.fieldName],
					parent: source,
					entityMetadata: metadata,
					fieldMetadata: relationship,
				});
			})();
			return res;
		}

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
