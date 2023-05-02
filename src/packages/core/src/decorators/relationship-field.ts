import { getMetadataStorage } from 'type-graphql';
import { ReturnTypeFunc } from 'type-graphql/dist/decorators/types';
import { findType } from 'type-graphql/dist/helpers/findType';
import { BaseLoaders } from '../base-loader';
import {
	BaseContext,
	BaseDataEntity,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphQLResolveInfo,
	HookRegister,
	ReadHookParams,
	hookManagerMap,
} from '..';

type RelationshipFieldOptions<D> = {
	relatedField?: keyof D & string;
	id?: keyof D & string;
};

export function RelationshipField<
	G extends GraphQLEntity<D> = any,
	D extends BaseDataEntity = G['dataEntity']
>(returnTypeFunc: ReturnTypeFunc, { relatedField, id }: RelationshipFieldOptions<D>) {
	return (target: any, key: string) => {
		// We now need to update the MetadataStorage for type graphql
		// this is so the new function that we return below is setup in the schema
		const metadata = getMetadataStorage();

		// first lets fetch the getType function
		const { getType, typeOptions } = findType({
			metadataKey: 'design:returntype',
			prototype: target,
			propertyKey: key,
			returnTypeFunc,
			typeOptions: { nullable: true },
		});

		// next we need to add the below function as a field resolver
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

		// then we need to link the method name to the schema name
		metadata.collectFieldResolverMetadata({
			kind: 'internal',
			methodName: key,
			schemaName: key,
			target: target.constructor,
			complexity: 0,
		});

		// we also need to attach some graphQL args to the function
		metadata.collectHandlerParamMetadata({
			kind: 'root',
			target: target.constructor,
			methodName: key,
			index: 0,
			propertyName: undefined,
			getType,
		});
		metadata.collectHandlerParamMetadata({
			kind: 'info',
			target: target.constructor,
			methodName: key,
			index: 1,
		});
		metadata.collectHandlerParamMetadata({
			kind: 'context',
			target: target.constructor,
			methodName: key,
			index: 2,
			propertyName: undefined,
		});

		// we then declare the field resolver for this field:
		const fieldResolver = async (root: any, info: GraphQLResolveInfo, context: BaseContext) => {
			const gqlEntityType = getType() as GraphQLEntityConstructor<G, D>;

			const params: ReadHookParams<G> = {
				args: { filter: { id } },
				info,
				context,
				transactional: false,
			};

			const hookManager = hookManagerMap.get(gqlEntityType.name);
			const hookParams = hookManager
				? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
				: params;

			let dataEntities: D[] | undefined = undefined;
			if (relatedField) {
				dataEntities = await BaseLoaders.loadByRelatedId({
					gqlEntityType,
					relatedField: relatedField,
					id: root.id,
				});
			}

			if (id) {
				const dataEntity = await BaseLoaders.loadOne({
					gqlEntityType,
					id: root.dataEntity[id],
				});
				dataEntities = [dataEntity];
			}

			const entities = dataEntities?.map((dataEntity) =>
				(gqlEntityType as any).fromBackendEntity(dataEntity)
			);

			const { entities: hookEntities = [] } = hookManager
				? await hookManager.runHooks(HookRegister.AFTER_READ, {
						...hookParams,
						entities,
				  })
				: { entities };

			return id ? hookEntities?.[0] : hookEntities;
		};

		// define new property descriptor to overwrite the current property on the class
		const descriptor = {
			enumerable: true,
			configurable: true,
			value: fieldResolver,
		};

		// define new property on class prototype
		Object.defineProperty(target, key, descriptor);
	};
}
