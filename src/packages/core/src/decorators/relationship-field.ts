import { Field, InputType, getMetadataStorage } from 'type-graphql';
import { findType } from 'type-graphql/dist/helpers/findType';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';
import { BaseLoaders } from '../base-loader';
import {
	BaseContext,
	BaseDataEntity,
	FieldMetadata,
	Filter,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphQLResolveInfo,
	HookRegister,
	ReadHookParams,
	hookManagerMap,
} from '..';
import { TypeMap } from '../common/types';
import { graphweaverMetadata } from '../metadata';

type RelationshipFieldOptions<D> = {
	relatedField?: keyof D & string;
	id?: (keyof D & string) | ((dataEntity: D) => string | number | undefined);
	nullable?: boolean;
};

interface ClassType<T extends GraphQLEntity<BaseDataEntity>> {
	new (...args: any[]): T;
}
interface RecursiveArray<TValue> extends Array<RecursiveArray<TValue> | TValue> {}
type TypeValue = ClassType<GraphQLEntity<BaseDataEntity>>;
type ReturnTypeFuncValue = TypeValue | RecursiveArray<TypeValue>;
type ReturnTypeFunc = () => ReturnTypeFuncValue;

export const addChildRelationshipFilterArg = (field: FieldMetadata) => {
	const relatedType = field.getType() as { name?: string };

	if (!relatedType.name) return;

	const relatedEntity = graphweaverMetadata.hasEntity(relatedType.name || '')
		? graphweaverMetadata.getEntity(relatedType.name)
		: undefined;

	if (relatedEntity?.provider.backendProviderConfig?.filter?.childByChild) {
		// add the child filter to the related field
		const metadata = getMetadataStorage();

		// Create filter arg for relationship field
		metadata.collectHandlerParamMetadata({
			kind: 'arg',
			target: field.target,
			methodName: field.name,
			index: 3,
			name: 'filter',
			description: 'Filter the related entities',
			deprecationReason: undefined,
			getType: () => TypeMap[`${relatedEntity.plural}ListFilter`],
			typeOptions: { nullable: true },
			validate: undefined,
		});
	}
};

export const addChildFiltersToRelatedFields = () => {
	for (const field of graphweaverMetadata.fields) {
		// if the field is an array, then we can add a filter
		if (field.typeOptions.array) addChildRelationshipFilterArg(field);
	}
};

export function RelationshipField<
	G extends GraphQLEntity<D> = any,
	D extends BaseDataEntity = G['dataEntity']
>(
	returnTypeFunc: ReturnTypeFunc,
	{ relatedField, id, nullable = false }: RelationshipFieldOptions<D>
) {
	return (target: any, key: string) => {
		if (!id && !relatedField)
			throw new Error(
				`Implementation Error: You must specify either an ID or a related field and neither was specified.`
			);
		// We now need to update the MetadataStorage for type graphql
		// this is so the new function that we return below is setup in the schema
		const metadata = getMetadataStorage();

		// first lets fetch the getType function
		const { getType, typeOptions } = findType({
			metadataKey: 'design:returntype',
			prototype: target,
			propertyKey: key,
			returnTypeFunc,
			typeOptions: { nullable },
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
		const fieldResolver = async (
			root: any,
			info: GraphQLResolveInfo,
			context: BaseContext,
			filter?: Filter<D>
		) => {
			const idValue = !id
				? undefined
				: typeof id === 'function'
				? id(root.dataEntity)
				: root.dataEntity[id];

			if (!idValue && !relatedField) {
				//id is null and we are loading a single instance so lets return null
				return null;
			}

			const gqlEntityType = getType() as GraphQLEntityConstructor<G, D>;

			const relatedEntityFilter = filter
				? filter
				: idValue
				? { id: idValue }
				: { [relatedField as string]: { id: root.id } };

			const params: ReadHookParams<G> = {
				args: { filter },
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
					filter: relatedEntityFilter,
				});
			}

			if (idValue) {
				const dataEntity = await BaseLoaders.loadOne({
					gqlEntityType,
					id: idValue,
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

			return idValue ? hookEntities?.[0] : hookEntities;
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
