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

export const addChildRelationshipFilterArg = <G>(field: FieldMetadata<G>) => {
	// const relatedType = field.getType() as { name?: string };
	// if (!relatedType.name) return;
	// const relatedEntity = graphweaverMetadata.hasEntity(relatedType.name || '')
	// 	? graphweaverMetadata.getEntity(relatedType.name)
	// 	: undefined;
	// if (relatedEntity?.provider?.backendProviderConfig?.filter?.childByChild) {
	// 	// Create filter arg for relationship field
	// 	graphweaverMetadata.collectHandlerParamMetadata({
	// 		kind: 'arg',
	// 		target: field.target,
	// 		methodName: field.name,
	// 		index: 3,
	// 		name: 'filter',
	// 		description: 'Filter the related entities',
	// 		deprecationReason: undefined,
	// 		getType: () => graphweaverMetadata.getInputType(`${relatedEntity.plural}ListFilter`),
	// 		typeOptions: { nullable: true },
	// 		validate: undefined,
	// 	});
	// }
};

export const addChildFiltersToRelationshipFields = () => {
	// for (const field of graphweaverMetadata.fields) {
	// 	// if the field is an array, then it might be a relationship, let's check if we should add a filter
	// 	if (field.typeOptions.array) addChildRelationshipFilterArg(field);
	// }
};

export function RelationshipField<
	G extends GraphQLEntity<D> = any,
	D extends BaseDataEntity = G['dataEntity'],
>(
	returnTypeFunc: ReturnTypeFunc,
	{ relatedField, id, nullable = false }: RelationshipFieldOptions<D>
) {
	return (target: any, key: string) => {
		// if (!id && !relatedField)
		// 	throw new Error(
		// 		`Implementation Error: You must specify either an ID or a related field and neither was specified.`
		// 	);
		// class RelationshipResolver {
		// 	static async resolve(
		// 		@Root() root: any,
		// 		@Info() info: GraphQLResolveInfo,
		// 		@Context() context: BaseContext,
		// 		@Arg() filter?: Filter<G>
		// 	) {
		// 		const idValue = !id
		// 			? undefined
		// 			: typeof id === 'function'
		// 				? id(root.dataEntity)
		// 				: root.dataEntity[id];
		// 		if (!idValue && !relatedField) {
		// 			// id is null and we are loading a single instance so let's return null
		// 			return null;
		// 		}
		// 		const gqlEntityType = getType() as GraphQLEntityConstructor<G, D>;
		// 		const relatedEntityFilter = filter
		// 			? filter
		// 			: idValue
		// 				? { id: idValue }
		// 				: { [relatedField as string]: { id: root.id } };
		// 		const params: ReadHookParams<G> = {
		// 			args: { filter },
		// 			info,
		// 			context,
		// 			transactional: false,
		// 		};
		// 		const hookManager = hookManagerMap.get(gqlEntityType.name);
		// 		const hookParams = hookManager
		// 			? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
		// 			: params;
		// 		let dataEntities: D[] | undefined = undefined;
		// 		if (relatedField) {
		// 			dataEntities = await BaseLoaders.loadByRelatedId({
		// 				gqlEntityType,
		// 				relatedField: relatedField,
		// 				id: root.id,
		// 				filter: relatedEntityFilter as Filter<G>,
		// 			});
		// 		}
		// 		if (idValue) {
		// 			const dataEntity = await BaseLoaders.loadOne({
		// 				gqlEntityType,
		// 				id: idValue,
		// 			});
		// 			dataEntities = [dataEntity];
		// 		}
		// 		const entities = dataEntities?.map((dataEntity) =>
		// 			(gqlEntityType as any).fromBackendEntity(dataEntity)
		// 		);
		// 		const { entities: hookEntities = [] } = hookManager
		// 			? await hookManager.runHooks(HookRegister.AFTER_READ, {
		// 					...hookParams,
		// 					entities,
		// 				})
		// 			: { entities };
		// 		return idValue ? hookEntities?.[0] : hookEntities;
		// 	}
		// }
		// // next we need to add the below function as a field resolver
		// graphweaverMetadata.collectFieldInformation({
		// 	name: key,
		// 	getType: returnTypeFunc,
		// 	nullable,
		// 	target: target.constructor,
		// 	resolver: RelationshipResolver.resolve,
		// });
	};
}
