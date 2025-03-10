import { GraphQLResolveInfo } from 'graphql';
import { GraphweaverSchemaInfoExtensionWithSourceEntity } from '../schema-builder';

export const getGraphweaverMutationType = (
	info: GraphQLResolveInfo
): GraphweaverSchemaInfoExtensionWithSourceEntity['type'] | undefined => {
	return (
		info?.schema?.getMutationType?.()?.getFields?.()[info?.fieldName]?.extensions
			?.graphweaverSchemaInfo as GraphweaverSchemaInfoExtensionWithSourceEntity | undefined
	)?.type;
};
