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
import {
	isExcludedFromFilterType,
	isExcludedFromInputTypes,
	isReadOnly,
	isReadOnlyProperty,
} from './decorators';
import { QueryManager } from './query-manager';
import { HookManager, HookRegister } from './hook-manager';

const arrayOperations = new Set(['in', 'nin']);
const supportedOrderByTypes = new Set(['ID', 'String', 'Number', 'Date', 'ISOString']);
const cachedTypeNames: Record<any, string> = {};
const scalarTypes = new Map<TypeValue, TypeValue>();

export const EntityMetadataMap = new Map<string, BaseResolverMetadataEntry<any>>();

export interface BaseResolverMetadataEntry<D extends BaseDataEntity> {
	provider: BackendProvider<D, GraphQLEntity<D>>;
	entity: ObjectClassMetadata;
	fields: FieldMetadata[];
	enums: EnumMetadata[];
	accessControlList?: any;
}

export function registerScalarType(scalarType: TypeValue, treatAsType: TypeValue) {
	scalarTypes.set(scalarType, treatAsType);
}

export interface BaseResolverInterface<T> {
	hookManager?: HookManager<T>;
}

const hasId = <G>(obj: Partial<G>): obj is Partial<G> & WithId => {
	return 'id' in obj && typeof obj.id === 'string';
};

// G = GraphQL entity
// D = Data Entity
export function createBaseResolver<G extends WithId, D extends BaseDataEntity>(
	gqlEntityType: GraphqlEntityType<G, D>,
	provider: BackendProvider<D, G>
): abstract new () => BaseResolverInterface<G> {
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
	const transactional = !!provider.startTransaction;

	const entityFields = metadata.fields.filter((field) => field.target === gqlEntityType);
	const enumSet = new Set(metadata.enums.map((enumMetadata) => enumMetadata.enumObj));

	EntityMetadataMap.set(objectNames[0].name, {
		provider,
		entity: objectNames[0],
		fields: entityFields,
		enums: metadata.enums,
	} as BaseResolverMetadataEntry<D>);

	const determineTypeName = (inputType: any) => {
		if (cachedTypeNames[inputType]) return cachedTypeNames[inputType];
		const typeNamesFromMetadata = metadata.objectTypes.filter(
			(objectType) => objectType.target === inputType
		);
		const result = typeNamesFromMetadata?.[0]?.name ?? inputType.name;
		cachedTypeNames[inputType] = result;
		return result;
	};

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
		if (
			isExcludedFromInputTypes(field.target, field.name) ||
			isExcludedFromFilterType(field.target, field.name)
		) {
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
		if (
			isExcludedFromInputTypes(field.target, field.name) ||
			isExcludedFromFilterType(field.target, field.name)
		) {
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

	@Resolver({ isAbstract: true })
	abstract class BaseResolver implements BaseResolverInterface<G> {
		public hookManager?: HookManager<G>;

		public async startTransaction<T>(callback: () => Promise<T>) {
			return provider.startTransaction ? provider.startTransaction<T>(callback) : callback();
		}

		public async runAfterHooks<H extends HookParams<G>>(
			hookRegister: HookRegister,
			hookParams: H,
			entities: (G | null)[]
		): Promise<(G | null)[]> {
			const { entities: hookEntities = [] } = this.hookManager
				? await this.hookManager.runHooks(hookRegister, {
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
			const params: ReadHookParams<G> = {
				args: { filter, pagination },
				info,
				context,
				transactional: false,
			};
			const hookParams = this.hookManager
				? await this.hookManager.runHooks(HookRegister.BEFORE_READ, params)
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
			const params: ReadHookParams<G> = {
				args: { filter: { id } },
				info,
				context,
				transactional: false,
			};

			const hookParams = this.hookManager
				? await this.hookManager.runHooks(HookRegister.BEFORE_READ, params)
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
	if (isReadOnly(gqlEntityType)) return BaseResolver;

	// Create Insert Input Args:
	@InputType(`${gqlEntityTypeName}InsertInput`)
	class InsertInputArgs {}
	TypeMap[`${gqlEntityTypeName}InsertInput`] = InsertInputArgs;

	for (const field of entityFields) {
		if (
			field.name === 'id' ||
			isExcludedFromInputTypes(field.target, field.name) ||
			isReadOnlyProperty(field.target, field.name)
		) {
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
		if (
			isExcludedFromInputTypes(field.target, field.name) ||
			isReadOnlyProperty(field.target, field.name)
		)
			continue;

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

	@Resolver({ isAbstract: true })
	abstract class WritableBaseResolver extends BaseResolver {
		private async runWritableBeforeHooks(
			hookRegister: HookRegister,
			params: CreateOrUpdateHookParams<G>
		): Promise<CreateOrUpdateHookParams<G>> {
			const hookParams = this.hookManager
				? await this.hookManager.runHooks(hookRegister, params)
				: params;

			const items = hookParams.args?.items;
			if (!items) throw new Error('No data specified cannot continue.');
			return params;
		}

		// Create many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `create${plural}` })
		async createMany(
			@Arg('input', () => InsertManyInputArgs) createItems: { data: Partial<G>[] },
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<Array<G | null>> {
			return this.startTransaction<Array<G | null>>(async () => {
				const params = await this.runWritableBeforeHooks(HookRegister.BEFORE_CREATE, {
					args: { items: createItems.data },
					info,
					context,
					transactional,
				});
				let { items } = params.args;

				// The type may want to further manipulate the input before passing it to the provider.
				if (gqlEntityType.mapInputForInsertOrUpdate) {
					const { mapInputForInsertOrUpdate } = gqlEntityType;
					items = items.map((createItem: any) => mapInputForInsertOrUpdate(createItem));
				}

				const results = await provider.createMany(items);

				if (gqlEntityType.fromBackendEntity) {
					const { fromBackendEntity } = gqlEntityType;
					const entities = results.map((result) => fromBackendEntity.call(gqlEntityType, result));
					return this.runAfterHooks(HookRegister.AFTER_CREATE, params, entities);
				}

				return results as any[];
			});
		}

		// Create
		@Mutation((returns) => gqlEntityType, { name: `create${gqlEntityTypeName}` })
		async createItem(
			@Arg('data', () => InsertInputArgs) createItemData: Partial<G>,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<G | null> {
			return this.startTransaction<G | null>(async () => {
				const params = await this.runWritableBeforeHooks(HookRegister.BEFORE_CREATE, {
					args: { items: [createItemData] },
					info,
					context,
					transactional,
				});
				let [item] = params.args.items;

				// The type may want to further manipulate the input before passing it to the provider.
				if (gqlEntityType.mapInputForInsertOrUpdate) {
					item = gqlEntityType.mapInputForInsertOrUpdate(item);
				}

				// Save!
				const results = await provider.createOne({ ...item });

				if (gqlEntityType.fromBackendEntity) {
					const result = gqlEntityType.fromBackendEntity.call(gqlEntityType, results);
					const [entity] = await this.runAfterHooks(HookRegister.AFTER_CREATE, params, [result]);
					return entity;
				}

				return results as any; // they're saying there's no need to map, so types don't align, but we trust the dev.
			});
		}

		// Update many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `update${plural}` })
		async updateMany(
			@Arg('input', () => UpdateManyInputArgs) updateItems: { data: Partial<G>[] },
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<Array<G | null>> {
			return this.startTransaction<Array<G | null>>(async () => {
				const params = await this.runWritableBeforeHooks(HookRegister.BEFORE_UPDATE, {
					args: { items: updateItems.data },
					info,
					context,
					transactional,
				});
				let { items } = params.args;

				// The type may want to further manipulate the input before passing it to the provider.
				if (gqlEntityType.mapInputForInsertOrUpdate) {
					const { mapInputForInsertOrUpdate } = gqlEntityType;
					items = items.map((item) => mapInputForInsertOrUpdate(item));
				}

				// Check that all objects have IDs
				const updateData = items.filter(hasId);
				if (!updateData.length) throw new Error('No ID found in input so cannot update entity.');

				const results = await provider.updateMany(updateData);

				if (gqlEntityType.fromBackendEntity) {
					const { fromBackendEntity } = gqlEntityType;
					const entities = results.map((result) => fromBackendEntity.call(gqlEntityType, result));
					return this.runAfterHooks(HookRegister.AFTER_UPDATE, params, entities);
				}

				return results as any[];
			});
		}

		// CreateOrUpdate many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `createOrUpdate${plural}` })
		async createOrUpdateMany(
			@Arg('input', () => CreateOrUpdateManyInputArgs) items: { data: Partial<G>[] },
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<Array<G | null>> {
			return this.startTransaction<Array<G | null>>(async () => {
				// Extracted common properties
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
					updateItems.length && this.hookManager
						? await this.hookManager.runHooks(HookRegister.BEFORE_UPDATE, updateParams)
						: updateParams;

				// Prepare createParams and run hook if needed
				const createParams: CreateOrUpdateHookParams<G> = {
					args: { items: createItems },
					...commonParams,
				};
				const createHookParams =
					createItems.length && this.hookManager
						? await this.hookManager.runHooks(HookRegister.BEFORE_CREATE, createParams)
						: createParams;

				// Combine update and create items into a single array
				let data = [
					...(updateHookParams.args?.items ?? []),
					...(createHookParams.args?.items ?? []),
				];

				// Apply mapInputForInsertOrUpdate if available
				if (gqlEntityType.mapInputForInsertOrUpdate) {
					const { mapInputForInsertOrUpdate } = gqlEntityType;
					data = data.map((updateItem: any) => mapInputForInsertOrUpdate(updateItem));
				}

				// Call provider.createOrUpdateMany with prepared data to perform data operation
				const results = await provider.createOrUpdateMany(data);

				// Apply fromBackendEntity if available and run after hooks
				if (gqlEntityType.fromBackendEntity) {
					const { fromBackendEntity } = gqlEntityType;
					const backendEntities = results.map((result) =>
						fromBackendEntity.call(gqlEntityType, result)
					);

					// Filter update and create entities
					const updatedEntities = backendEntities.filter(
						(entity) => entity && updateItemIds.includes(entity.id)
					);
					const createdEntities = backendEntities.filter(
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
				}

				// Fallback if we do not have a fromBackendEntity function to call
				return results as any[];
			});
		}

		// Update
		@Mutation((returns) => gqlEntityType, { name: `update${gqlEntityTypeName}` })
		async update(
			@Arg('data', () => UpdateInputArgs) updateItemData: Partial<G>,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		): Promise<G | null> {
			return this.startTransaction<G | null>(async () => {
				const params = await this.runWritableBeforeHooks(HookRegister.BEFORE_UPDATE, {
					args: { items: [updateItemData] },
					info,
					context,
					transactional,
				});
				let [item] = params.args.items;

				// The type may want to further manipulate the input before passing it to the provider.
				if (gqlEntityType.mapInputForInsertOrUpdate) {
					item = gqlEntityType.mapInputForInsertOrUpdate(item);
				}

				if (!updateItemData.id) throw new Error('No ID found in input so cannot update entity.');

				// Update and save!
				const results = await provider.updateOne(updateItemData.id, item);

				if (gqlEntityType.fromBackendEntity) {
					const result = gqlEntityType.fromBackendEntity.call(gqlEntityType, results);
					const [entity] = await this.runAfterHooks(HookRegister.AFTER_UPDATE, params, [result]);
					return entity;
				}

				return results as any; // they're saying there's no need to map, so types don't align, but we trust the dev.
			});
		}

		// Delete
		@Mutation((returns) => Boolean, { name: `delete${gqlEntityTypeName}` })
		async deleteItem(
			@Arg('id', () => ID) id: string,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: BaseContext
		) {
			const params: DeleteHookParams<G> = {
				args: { filter: { id } },
				info,
				context,
				transactional: false,
			};

			const hookParams = this.hookManager
				? await this.hookManager.runHooks(HookRegister.BEFORE_DELETE, params)
				: params;

			if (!hookParams.args?.filter) throw new Error('No delete filter specified cannot continue.');

			const success = await provider.deleteOne(hookParams.args?.filter);

			this.hookManager &&
				(await this.hookManager.runHooks(HookRegister.AFTER_DELETE, {
					...hookParams,
					deleted: success,
				}));

			return success;
		}
	}

	return WritableBaseResolver;
}
