import { GraphQLArgument, GraphQLResolveInfo, Source } from 'graphql';
import { BaseContext } from './types';
import { GraphQLEntity, graphweaverMetadata, isRelatedEntity } from '.';

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

const isDeserializable = (
	entity: typeof GraphQLEntity
): entity is typeof GraphQLEntity & {
	deserialize: <T>(value: unknown) => T;
} => entity && entity.hasOwnProperty('deserialize');

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
		let type = relationship?.getType() as unknown;
		if (Array.isArray(type)) {
			type = type[0];
		}

		if (type && isRelatedEntity(type) && isDeserializable(type)) {
			return type.deserialize(source, args, context, info);
		}

		if (isFunction(property)) {
			return property(source, args, context, info);
		}

		return property;
	}
};
