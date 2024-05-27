import { GraphQLArgument, GraphQLResolveInfo, Source } from 'graphql';
import { BaseContext } from './types';
import {
	getFieldTypeFromFieldMetadata,
	graphweaverMetadata,
	isEntityMetadata,
	isSerializableGraphQLEntityClass,
} from '.';

const isObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value == 'object' && value !== null;
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

		const parent = info.parentType.name;
		const key = info.fieldName;
		const metadata = graphweaverMetadata.getEntityByName(parent);
		if (!metadata) throw new Error(`Could not locate metadata for the '${parent}' entity`);

		const relationship = metadata.fields[key];

		const { fieldType } = getFieldTypeFromFieldMetadata(relationship);
		const fieldTypeMetadata = graphweaverMetadata.metadataForType(fieldType);

		if (isEntityMetadata(fieldTypeMetadata) && isSerializableGraphQLEntityClass(fieldType)) {
			return fieldType.deserialize({
				value: property,
				parent: source,
				entityMetadata: metadata,
				fieldMetadata: relationship,
			});
		}

		if (typeof property === 'function') {
			return property(source, args, context, info);
		}

		return property;
	}
};
