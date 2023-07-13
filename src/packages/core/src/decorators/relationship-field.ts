import { getMetadataStorage } from 'type-graphql';
import { ReturnTypeFunc, TypeValueThunk } from 'type-graphql/dist/decorators/types';
import { findType } from 'type-graphql/dist/helpers/findType';
import { BaseLoaders } from '../base-loader';
import {
	BaseContext,
	BaseDataEntity,
	Filter,
	GraphQLEntity,
	GraphQLEntityConstructor,
	GraphQLResolveInfo,
	HookRegister,
	ReadHookParams,
	hookManagerMap,
} from '..';
import { TypeMap } from '../common/types';
import pluralize from 'pluralize';

type RelationshipFieldOptions<D> = {
	relatedField?: keyof D & string;
	id?: (keyof D & string) | ((dataEntity: D) => string);
};

export function RelationshipField<
	G extends GraphQLEntity<D> = any,
	D extends BaseDataEntity = G['dataEntity']
>(returnTypeFunc: ReturnTypeFunc, { relatedField, id }: RelationshipFieldOptions<D>) {
	return (target: any, key: string) => {
		if (!id && !relatedField)
			throw new Error(
				`Implementation Error: You must specify either an ID or a related field and neither was specified.`
			);
		// We now need to update the MetadataStorage for type graphql
		// this is so the new function that we return below is setup in the schema
		const metadata = getMetadataStorage();
		console.log('target', target);
		console.log('key', key);
		console.log('typeMap', TypeMap);

		// first lets fetch the getType function
		const { getType, typeOptions } = findType({
			metadataKey: 'design:returntype',
			prototype: target,
			propertyKey: key,
			returnTypeFunc,
			typeOptions: { nullable: true },
		});

		// getType for related field
		// const { getType: getRelatedType, typeOptions: relatedTypeOptions } = findType({
		// 	metadataKey: 'design:paramtypes',
		// 	prototype: target,
		// 	propertyKey: key,
		// 	returnTypeFunc,
		// 	typeOptions: { nullable: true },
		// });
		const cachedTypeNames: Record<any, string> = {};

		//get the field metadata of this
		const field = metadata.fields.find(
			(field) => field.target === target.constructor && field.name === key
		);
		// THIS IS UNDEFINED ^^

		const getRelatedType = () => {
			// capitalize first letter of key
			const typeName = key.charAt(0).toUpperCase() + key.slice(1);

			// If it doesn't have a name it might be an enum or similar.
			return key
				? TypeMap[`${pluralize(typeName)}ListFilter`] || field?.getType()
				: field?.getType();
		};

		console.log('getType', getType());
		//console.log('getRelatedType', getRelatedType());

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

		// const gqlEntityType = returnTypeFunc();
		// const plural = pluralize(gqlEntityType.name);
		// const typeMap = TypeMap[`${plural}FilterInput`];

		// add arg, to filter to related filter
		metadata.collectHandlerParamMetadata({
			kind: 'arg',
			target: target.constructor,
			methodName: key,
			index: 3,
			name: 'schmilter',
			// @todo - check if below is correct
			description: 'Filter the related entities',
			deprecationReason: undefined,
			// what goes here?
			getType: getRelatedType,
			typeOptions: { nullable: true },
			validate: undefined,
		});

		if (relatedField) {
			console.log('relatedField', relatedField);
		}
		// we then declare the field resolver for this field:
		const fieldResolver = async (
			root: any,
			info: GraphQLResolveInfo,
			context: BaseContext,
			schmilter: Filter<D>
		) => {
			const idValue = !id
				? undefined
				: typeof id === 'function'
				? id(root.dataEntity)
				: root.dataEntity[id];

			const gqlEntityType = getType() as GraphQLEntityConstructor<G, D>;

			const filter = idValue ? { id: idValue } : { [relatedField as string]: { id: root.id } };

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
					filter: schmilter,
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
