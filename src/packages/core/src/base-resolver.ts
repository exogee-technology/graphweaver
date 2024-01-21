import { GraphQLResolveInfo, GraphQLScalarType } from 'graphql';
import pluralize from 'pluralize';
import {
	Arg,
	Ctx,
	Field,
	getMetadataStorage,
	ID,
	Info,
	InputType,
	Int,
	Mutation,
	Query,
	Resolver,
} from 'type-graphql';
import { TypeValue } from 'type-graphql/dist/decorators/types';
import { EnumMetadata, FieldMetadata } from 'type-graphql/dist/metadata/definitions';
import { ObjectClassMetadata } from 'type-graphql/dist/metadata/definitions/object-class-metdata';

import { BaseDataEntity, GraphQLEntity } from '.';
import type {
	BackendProvider,
	CreateOrUpdateHookParams,
	DeleteHookParams,
	Filter,
	GraphqlEntityType,
	WithId,
	OrderByOptions,
	PaginationOptions,
	ReadHookParams,
	HookParams,
	BaseContext,
} from './common/types';
import { Sort, TypeMap } from './common/types';
import { isExcludedFromFilterType, isReadOnlyBackend, isReadOnlyProperty } from './decorators';
import { QueryManager } from './query-manager';
import { HookManager, HookRegister } from './hook-manager';
import { createOrUpdateEntities, runWritableBeforeHooks } from './utils/create-or-update-entities';

const arrayOperations = new Set(['in', 'nin']);
const supportedOrderByTypes = new Set(['ID', 'String', 'Number', 'Date', 'ISOString']);
const cachedTypeNames: Record<any, string> = {};
const scalarTypes = new Map<TypeValue, TypeValue>();

export const EntityMetadataMap = new Map<string, BaseResolverMetadataEntry<any>>();
export const hookManagerMap = new Map<string, HookManager<any>>([]);

export interface BaseResolverMetadataEntry<D extends BaseDataEntity> {
	provider: BackendProvider<D, GraphQLEntity<D>>;
	entity: ObjectClassMetadata;
	fields: FieldMetadata[];
	enums: EnumMetadata[];
}

export function registerScalarType(scalarType: TypeValue, treatAsType: TypeValue) {
	scalarTypes.set(scalarType, treatAsType);
}

export interface BaseResolverInterface {}

export const hasId = <G>(obj: Partial<G>): obj is Partial<G> & WithId => {
	return 'id' in obj && typeof obj.id === 'string';
};

// G = GraphQL entity
// D = Data Entity
export function createBaseResolver<G extends WithId, D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<G, D>,
	provider: BackendProvider<D, G>
): abstract new (
	gqlEntityType: GraphqlEntityType<G, D>,
	provider: BackendProvider<D, G>
) => BaseResolverInterface {
	const metadata = getMetadataStorage();
	const objectNames = metadata.objectTypes.filter(
		(objectType) => objectType.target === gqlEntityType
	);
	if (objectNames.length !== 1) {
		throw new Error(
			'ObjectType name parameter was not set for GQL entity deriving from BaseEntity'
		);
	}

	const gqlEntityTypeName = objectNames[0].name;
	const plural = pluralize(gqlEntityTypeName);
	const transactional = !!provider.withTransaction;

	const entityFields = metadata.fields.filter((field) => field.target === gqlEntityType);
	const enumSet = new Set(metadata.enums.map((enumMetadata) => enumMetadata.enumObj));

	const entityMetadata: BaseResolverMetadataEntry<D> = {
		provider,
		entity: objectNames[0],
		fields: entityFields,
		enums: metadata.enums,
	};

	EntityMetadataMap.set(objectNames[0].name, entityMetadata);

	const determineTypeName = (inputType: any) => {
		if (cachedTypeNames[inputType]) return cachedTypeNames[inputType];
		const typeNamesFromMetadata = metadata.objectTypes.filter(
			(objectType) => objectType.target === inputType
		);
		const result = typeNamesFromMetadata?.[0]?.name ?? inputType.name;
		cachedTypeNames[inputType] = result;
		return result;
	};

	// Create if  data provider supports filter
	// Create List Filter Args:
	@InputType(`${plural}ListFilter`)
	class ListInputFilterArgs {
		@Field(() => [ListInputFilterArgs], { nullable: true })
		_and?: ListInputFilterArgs[];

		@Field(() => [ListInputFilterArgs], { nullable: true })
		_or?: ListInputFilterArgs[];

		@Field(() => ListInputFilterArgs, { nullable: true })
		_not?: ListInputFilterArgs;
	}
	TypeMap[`${plural}ListFilter`] = ListInputFilterArgs;

	for (const field of entityFields) {
		// We can explicitly exclude a field from filtering with a decorator.
		if (isExcludedFromFilterType(field.target, field.name)) {
			continue;
		}

		const fieldCopy = Object.assign({}, field);
		fieldCopy.target = ListInputFilterArgs;
		fieldCopy.typeOptions = { nullable: true };
		// We need to translate from entity fields, e.g. a course => subject needs to actually become
		// course list filter input => subject list filter input.
		//
		// Do this lazily to ensure we handle circular references.
		fieldCopy.getType = () => {
			// Look for an associated ListFilter class, or if it doesn't exist just pass the
			// original type, as we can also setup input args as the entities themselves.
			const typeName = determineTypeName(field.getType());

			// If it doesn't have a name it might be an enum or similar.
			return typeName
				? TypeMap[`${pluralize(typeName)}ListFilter`] || field.getType()
				: field.getType();
		};

		metadata.collectClassFieldMetadata(fieldCopy);

		// There are extra operations for certain types. We also allow
		// users to specify an alias type in case they want a scalar of theirs
		// to get treated as a certain type.
		const fieldType = scalarTypes.has(field.getType())
			? (scalarTypes.get(field.getType()) as TypeValue)
			: field.getType();

		const metadataForField = (operation: string) => ({
			name: `${field.name}_${operation}`,
			schemaName: `${field.name}_${operation}`,
			description: undefined,
			target: ListInputFilterArgs,
			getType: () => fieldType,
			typeOptions: {
				nullable: true,
				array: arrayOperations.has(operation),
				arrayDepth: arrayOperations.has(operation) ? 1 : undefined,
			},
			deprecationReason: undefined,
			complexity: 1,
		});

		if (fieldType === ID || enumSet.has(fieldType as any)) {
			['ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) =>
				metadata.collectClassFieldMetadata(metadataForField(operation))
			);
		} else if (fieldType === String) {
			['ne', 'in', 'nin', 'like', 'ilike', 'notnull', 'null'].forEach((operation) =>
				metadata.collectClassFieldMetadata(metadataForField(operation))
			);
		} else if (
			fieldType === Number ||
			fieldType === Date ||
			(fieldType as GraphQLScalarType)?.['name'] === 'ISOString'
		) {
			// @todo: Add support for other scalar types (i.e 'ISOString') there is a circular dependency issue at present
			['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) =>
				metadata.collectClassFieldMetadata(metadataForField(operation))
			);
		}
	}

	@InputType(`${plural}FilterInput`)
	class FilterInputArgs {
		@Field(() => FilterInputArgs, { nullable: true })
		filter?: typeof gqlEntityTypeName;
	}
	TypeMap[`${plural}FilterInput`] = FilterInputArgs;

	for (const field of entityFields) {
		// We can explicitly exclude a field from filtering with a decorator.
		if (isExcludedFromFilterType(field.target, field.name)) {
			continue;
		}

		const fieldCopy = Object.assign({}, field);
		fieldCopy.target = FilterInputArgs;
		fieldCopy.typeOptions = { nullable: true };
		// We need to translate from entity fields, e.g. a course => subject needs to actually become
		// course list filter input => subject list filter input.
		//
		// Do this lazily to ensure we handle circular references.
		fieldCopy.getType = () => {
			// Look for an associated FilterInput class, or if it doesn't exist just pass the
			// original type, as we can also setup input args as the entities themselves.
			const typeName = determineTypeName(field.getType());

			// If it doesn't have a name it might be an enum or similar.
			return typeName
				? TypeMap[`${pluralize(typeName)}FilterInput`] || field.getType()
				: field.getType();
		};
		metadata.collectClassFieldMetadata(fieldCopy);

		// There are extra operations for certain types. We also allow
		// users to specify an alias type in case they want a scalar of theirs
		// to get treated as a certain type.
		const fieldType = scalarTypes.has(field.getType())
			? (scalarTypes.get(field.getType()) as TypeValue)
			: field.getType();

		const metadataForField = (operation: string) => ({
			name: `${field.name}_${operation}`,
			schemaName: `${field.name}_${operation}`,
			description: undefined,
			target: FilterInputArgs,
			getType: () => fieldType,
			typeOptions: {
				nullable: true,
				array: arrayOperations.has(operation),
				arrayDepth: arrayOperations.has(operation) ? 1 : undefined,
			},
			deprecationReason: undefined,
			complexity: 1,
		});

		if (fieldType === ID || enumSet.has(fieldType as any)) {
			['ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) =>
				metadata.collectClassFieldMetadata(metadataForField(operation))
			);
		} else if (fieldType === String) {
			['ne', 'in', 'nin', 'like', 'ilike', 'notnull', 'null'].forEach((operation) =>
				metadata.collectClassFieldMetadata(metadataForField(operation))
			);
		} else if (
			fieldType === Number ||
			fieldType === Date ||
			(fieldType as GraphQLScalarType)?.['name'] === 'ISOString'
		) {
			['gt', 'gte', 'lt', 'lte', 'ne', 'in', 'nin', 'notnull', 'null'].forEach((operation) =>
				metadata.collectClassFieldMetadata(metadataForField(operation))
			);
		}
	}

	// Create Pagination Input Types;
	@InputType(`${plural}OrderByInput`)
	class OrderByInputArgs {}
	@InputType(`${plural}PaginationInput`)
	class PaginationInputArgs {
		@Field(() => Int, { nullable: true })
		limit?: number;

		@Field(() => Int, { nullable: true })
		offset?: number;

		@Field(() => OrderByInputArgs, { nullable: true })
		orderBy?: OrderByOptions;
	}
	TypeMap[`${plural}PaginationInput`] = PaginationInputArgs;
	for (const field of entityFields) {
		const fieldType = field.getType() as any;

		if (
			field.name !== 'id' &&
			fieldType &&
			!supportedOrderByTypes.has(fieldType.name) &&
			!enumSet.has(fieldType as any)
		) {
			continue;
		}

		const fieldCopy = Object.assign({}, field);
		fieldCopy.target = OrderByInputArgs;
		fieldCopy.typeOptions = { nullable: true };
		fieldCopy.getType = () => Sort;
		metadata.collectClassFieldMetadata(fieldCopy);
	}

	@Resolver()
	abstract class BaseResolver implements BaseResolverInterface {
		public async withTransaction<T>(callback: () => Promise<T>) {
			return provider.withTransaction ? provider.withTransaction<T>(callback) : callback();
		}

		public async runAfterHooks<H extends HookParams<G>>(
			hookRegister: HookRegister,
			hookParams: H,
			entities: (G | null)[]
		): Promise<(G | null)[]> {
			const hookManager = hookManagerMap.get(gqlEntityTypeName);
			const { entities: hookEntities = [] } = hookManager
				? await hookManager.runHooks(hookRegister, {
						...hookParams,
						entities,
				  })
				: { entities };

			return hookEntities;
		}

		// List
		@Query(() => [gqlEntityType], {
			name: plural.charAt(0).toLowerCase() + plural.substring(1),
		})
		public async list(
			@Arg('filter', () => ListInputFilterArgs, { nullable: true })
			filter: Filter<G>,
			@Arg('pagination', () => PaginationInputArgs, { nullable: true })
			pagination: PaginationOptions,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<Array<G | null>> {
			const hookManager = hookManagerMap.get(gqlEntityTypeName);
			const params: ReadHookParams<G> = {
				args: { filter, pagination },
				info,
				context,
				transactional: false,
			};
			const hookParams = hookManager
				? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
				: params;

			const result = await QueryManager.find<D, G>({
				entityName: gqlEntityTypeName,
				filter: hookParams.args?.filter,
				pagination: hookParams.args?.pagination,
			});

			if (gqlEntityType.fromBackendEntity) {
				const { fromBackendEntity } = gqlEntityType;
				const entities = result.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
				return this.runAfterHooks(HookRegister.AFTER_READ, hookParams, entities);
			}
			return result as any; // if there's no conversion function, we assume the gql and backend types match
		}

		// Get One
		@Query(() => gqlEntityType, {
			name: gqlEntityTypeName.charAt(0).toLowerCase() + gqlEntityTypeName.substring(1),
			nullable: true,
		})
		public async getOne(
			@Arg('id', () => ID) id: string,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<G | null> {
			const hookManager = hookManagerMap.get(gqlEntityTypeName);
			const params: ReadHookParams<G> = {
				args: { filter: { id } },
				info,
				context,
				transactional: false,
			};

			const hookParams = hookManager
				? await hookManager.runHooks(HookRegister.BEFORE_READ, params)
				: params;

			if (!hookParams.args?.filter) throw new Error('No find filter specified cannot continue.');

			const result = await provider.findOne(hookParams.args.filter);

			if (result && gqlEntityType.fromBackendEntity) {
				const entity = gqlEntityType.fromBackendEntity.call(gqlEntityType, result);
				const entities = await this.runAfterHooks(HookRegister.AFTER_READ, hookParams, [entity]);
				return entities[0] ?? null;
			}
			return result as any; // if there's no conversion function, we assume the gql and backend types match
		}
	}

	// If it's read only we're done here.
	if (isReadOnlyBackend(gqlEntityType)) return BaseResolver;

	// Create Insert Input Args:
	@InputType(`${gqlEntityTypeName}InsertInput`)
	class InsertInputArgs {}
	TypeMap[`${gqlEntityTypeName}InsertInput`] = InsertInputArgs;

	for (const field of entityFields) {
		if (field.name === 'id' || isReadOnlyProperty(field.target, field.name)) {
			continue;
		}
		const fieldCopy = Object.assign({}, field);
		// To ensure we get a deep copy.
		fieldCopy.typeOptions = { ...field.typeOptions };
		fieldCopy.target = InsertInputArgs;
		// We need to translate from entity fields, e.g. a course => subject needs to actually become
		// course insert input args => subject insert input args.
		//
		// Do this lazily to ensure we handle circular references.
		fieldCopy.getType = () => {
			// Look for an associated ListFilter class, or if it doesn't exist just pass the
			// original type, as we can also setup input args as the entities themselves.
			const typeName = determineTypeName(field.getType());
			// If it doesn't have a name it might be an enum or similar.
			return typeName
				? TypeMap[`${pluralize(typeName)}CreateOrUpdateInput`] || field.getType()
				: field.getType();
		};

		if (field.getType() !== String && field.getType() !== Number) {
			fieldCopy.typeOptions.nullable = true;
		}

		metadata.collectClassFieldMetadata(fieldCopy);
	}

	// Create Insert Many Input Args:
	@InputType(`${plural}InsertManyInput`)
	class InsertManyInputArgs {
		@Field(() => [InsertInputArgs])
		data?: InsertInputArgs[];
	}
	TypeMap[`${plural}InsertManyInput`] = InsertManyInputArgs;

	// Create Update Input Args:
	@InputType(`${gqlEntityTypeName}CreateOrUpdateInput`)
	class UpdateInputArgs {}
	TypeMap[`${plural}CreateOrUpdateInput`] = UpdateInputArgs;

	for (const field of entityFields) {
		if (isReadOnlyProperty(field.target, field.name)) continue;

		const fieldCopy = Object.assign({}, field);
		fieldCopy.target = UpdateInputArgs;
		// All fields except ID are nullable in this type.
		fieldCopy.typeOptions = {
			...field.typeOptions,
			nullable: true, // all fields optional to support nested create/update scenarios. Previously checked whether field.name !== 'id'
		};

		// We need to translate from entity fields, e.g. a course => subject needs to actually become
		// course update input args => subject update input args.
		//
		// Do this lazily to ensure we handle circular references.
		fieldCopy.getType = () => {
			// Look for an associated ListFilter class, or if it doesn't exist just pass the
			// original type, as we can also setup input args as the entities themselves.
			const typeName = determineTypeName(field.getType());
			// If it doesn't have a name it might be an enum or similar.
			return typeName
				? TypeMap[`${pluralize(typeName)}CreateOrUpdateInput`] || field.getType()
				: field.getType();
		};
		metadata.collectClassFieldMetadata(fieldCopy);
	}

	// Create Update Many Input Args:
	@InputType(`${plural}UpdateManyInput`)
	class UpdateManyInputArgs {
		@Field(() => [UpdateInputArgs])
		data?: UpdateInputArgs[];
	}
	TypeMap[`${plural}UpdateManyInput`] = UpdateManyInputArgs;

	// Create or Update Many Input Args:
	@InputType(`${plural}CreateOrUpdateManyInput`)
	class CreateOrUpdateManyInputArgs {
		@Field(() => [UpdateInputArgs, InsertInputArgs])
		data?: UpdateInputArgs | InsertInputArgs[];
	}
	TypeMap[`${plural}CreateOrUpdateManyInput`] = CreateOrUpdateManyInputArgs;

	@Resolver()
	abstract class WritableBaseResolver extends BaseResolver {
		// Create many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `create${plural}` })
		async createMany(
			@Arg('input', () => InsertManyInputArgs) createItems: { data: Partial<G>[] },
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<Array<G | null>> {
			return this.withTransaction<Array<G | null>>(async () => {
				const params = await runWritableBeforeHooks(
					HookRegister.BEFORE_CREATE,
					{
						args: { items: createItems.data },
						info,
						context,
						transactional,
					},
					gqlEntityTypeName
				);
				const { items } = params.args;
				const entities = (await createOrUpdateEntities(
					items,
					gqlEntityType.name,
					info,
					context
				)) as G[];
				return this.runAfterHooks(HookRegister.AFTER_CREATE, params, entities);
			});
		}

		// Create
		@Mutation((returns) => gqlEntityType, { name: `create${gqlEntityTypeName}` })
		async createItem(
			@Arg('data', () => InsertInputArgs) createItemData: Partial<G>,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<G | null> {
			return this.withTransaction<G | null>(async () => {
				const params = await runWritableBeforeHooks(
					HookRegister.BEFORE_CREATE,
					{
						args: { items: [createItemData] },
						info,
						context,
						transactional,
					},
					gqlEntityTypeName
				);
				const [item] = params.args.items;

				const result = (await createOrUpdateEntities(item, gqlEntityType.name, info, context)) as G;
				const [entity] = await this.runAfterHooks(HookRegister.AFTER_CREATE, params, [result]);
				return entity;
			});
		}

		// Update many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `update${plural}` })
		async updateMany(
			@Arg('input', () => UpdateManyInputArgs) updateItems: { data: Partial<G>[] },
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<Array<G | null>> {
			return this.withTransaction<Array<G | null>>(async () => {
				const params = await runWritableBeforeHooks(
					HookRegister.BEFORE_UPDATE,
					{
						args: { items: updateItems.data },
						info,
						context,
						transactional,
					},
					gqlEntityTypeName
				);
				const { items } = params.args;

				// Check that all objects have IDs
				const updateData = items.filter(hasId);
				if (!updateData.length) throw new Error('No ID found in input so cannot update entity.');

				const entities = (await createOrUpdateEntities(
					items,
					gqlEntityType.name,
					info,
					context
				)) as G[];
				return this.runAfterHooks(HookRegister.AFTER_UPDATE, params, entities);
			});
		}

		// CreateOrUpdate many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `createOrUpdate${plural}` })
		async createOrUpdateMany(
			@Arg('input', () => CreateOrUpdateManyInputArgs) items: { data: Partial<G>[] },
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<Array<G | null>> {
			return this.withTransaction<Array<G | null>>(async () => {
				// Extracted common properties
				const hookManager = hookManagerMap.get(gqlEntityTypeName);
				const commonParams: Omit<CreateOrUpdateHookParams<G>, 'args'> = {
					info,
					context,
					transactional,
				};

				// Separate Create and Update items
				const updateItems = items.data.filter(hasId);
				const createItems = items.data.filter((value) => !hasId(value));

				// Extract ids of items being updated
				const updateItemIds = updateItems.map((item) => item.id) ?? [];

				// Prepare updateParams and run hook if needed
				const updateParams: CreateOrUpdateHookParams<G> = {
					args: { items: updateItems },
					...commonParams,
				};
				const updateHookParams =
					updateItems.length && hookManager
						? await hookManager.runHooks(HookRegister.BEFORE_UPDATE, updateParams)
						: updateParams;

				// Prepare createParams and run hook if needed
				const createParams: CreateOrUpdateHookParams<G> = {
					args: { items: createItems },
					...commonParams,
				};
				const createHookParams =
					createItems.length && hookManager
						? await hookManager.runHooks(HookRegister.BEFORE_CREATE, createParams)
						: createParams;

				// Combine update and create items into a single array
				const data = [
					...(updateHookParams.args?.items ?? []),
					...(createHookParams.args?.items ?? []),
				];

				const entities = (await createOrUpdateEntities(
					data,
					gqlEntityType.name,
					info,
					context
				)) as G[];

				// Filter update and create entities
				const updatedEntities = entities.filter(
					(entity) => entity && updateItemIds.includes(entity.id)
				);
				const createdEntities = entities.filter(
					(entity) => entity && !updateItemIds.includes(entity.id)
				);

				// Run after hooks for update and create entities
				const updateHookEntities = await this.runAfterHooks(
					HookRegister.AFTER_UPDATE,
					updateHookParams,
					updatedEntities
				);
				const createHookEntities = await this.runAfterHooks(
					HookRegister.AFTER_CREATE,
					createHookParams,
					createdEntities
				);

				// Return combined results from after hooks
				return [...createHookEntities, ...updateHookEntities];
			});
		}

		// Update
		@Mutation((returns) => gqlEntityType, { name: `update${gqlEntityTypeName}` })
		async update(
			@Arg('data', () => UpdateInputArgs) updateItemData: Partial<G>,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<G | null> {
			return this.withTransaction<G | null>(async () => {
				const params = await runWritableBeforeHooks(
					HookRegister.BEFORE_UPDATE,
					{
						args: { items: [updateItemData] },
						info,
						context,
						transactional,
					},
					gqlEntityTypeName
				);
				const [item] = params.args.items;

				if (!updateItemData.id) throw new Error('No ID found in input so cannot update entity.');

				const result = (await createOrUpdateEntities(item, gqlEntityType.name, info, context)) as G;
				const [entity] = await this.runAfterHooks(HookRegister.AFTER_UPDATE, params, [result]);
				return entity;
			});
		}

		// Delete
		@Mutation((returns) => Boolean, { name: `delete${gqlEntityTypeName}` })
		async deleteItem(
			@Arg('id', () => ID) id: string,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		) {
			const hookManager = hookManagerMap.get(gqlEntityTypeName);
			const params: DeleteHookParams<G> = {
				args: { filter: { id } },
				info,
				context,
				transactional: false,
			};

			const hookParams = hookManager
				? await hookManager.runHooks(HookRegister.BEFORE_DELETE, params)
				: params;

			if (!hookParams.args?.filter) throw new Error('No delete filter specified cannot continue.');

			const success = await provider.deleteOne(hookParams.args?.filter);

			hookManager &&
				(await hookManager.runHooks(HookRegister.AFTER_DELETE, {
					...hookParams,
					deleted: success,
				}));

			return success;
		}
	}

	return WritableBaseResolver;
}
