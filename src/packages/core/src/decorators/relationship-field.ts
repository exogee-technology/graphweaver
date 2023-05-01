import { getMetadataStorage } from 'type-graphql';
import { ReturnTypeFunc } from 'type-graphql/dist/decorators/types';
import { findType } from 'type-graphql/dist/helpers/findType';
import { BaseLoaders } from '../base-loader';
import { BaseDataEntity, GraphQLEntityConstructor } from '..';

type RelationshipFieldOptions<D> = {
	relatedField: keyof D & string;
};

export function RelationshipField<G extends GraphQLEntityConstructor<BaseDataEntity>>(
	returnTypeFunc: ReturnTypeFunc,
	{ relatedField }: RelationshipFieldOptions<any>
) {
	return (target: any, key: string) => {
		const metadata = getMetadataStorage();

		const { getType, typeOptions } = findType({
			metadataKey: 'design:returntype',
			prototype: target,
			propertyKey: key,
			returnTypeFunc,
			typeOptions: { nullable: true },
		});
		metadata.collectClassFieldMetadata({
			name: key,
			schemaName: key,
			getType,
			typeOptions,
			complexity: 0,
			target: target.constructor,
			description: '',
			deprecationReason: undefined,
			simple: false,
		});
		metadata.collectFieldResolverMetadata({
			kind: 'internal',
			methodName: key,
			schemaName: key,
			target: target.constructor,
			complexity: 0,
		});
		metadata.collectHandlerParamMetadata({
			kind: 'root',
			target: target.constructor,
			methodName: key,
			index: 0,
			propertyName: undefined,
			getType,
		});

		// define new property descriptor
		const descriptor = {
			enumerable: true,
			configurable: true,
			value: async (root: any) => {
				const gqlEntityType = getType() as G;
				const tags = await BaseLoaders.loadByRelatedId({
					gqlEntityType,
					relatedField: relatedField as any,
					id: root.id,
				});

				return tags.map((tag) => (gqlEntityType as any).fromBackendEntity(tag));
			},
		};

		// define new property on class prototype
		Object.defineProperty(target, key, descriptor);
	};
}
