import { logger } from '@exogee/logger';
import { GraphQLResolveInfo, GraphQLScalarType, GraphQLType } from 'graphql';
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
import { FieldsByTypeName, parseResolveInfo, ResolveTree } from 'graphql-parse-resolve-info';

import { AclMap } from '.';
import type {
	AuthorizationContext,
	BackendProvider,
	GraphqlEntityType,
	OrderByOptions,
	PaginationOptions,
} from './common/types';
import { AccessControlList, Sort, TypeMap } from './common/types';
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

export const EntityMetadataMap = new Map<string, BaseResolverMetadataEntry>();

export interface BaseResolverMetadataEntry {
	provider: BackendProvider<any>;
	entity: ObjectClassMetadata;
	fields: FieldMetadata[];
	enums: EnumMetadata[];
	accessControlList?: AccessControlList<any>;
}

export function registerScalarType(scalarType: TypeValue, treatAsType: TypeValue) {
	scalarTypes.set(scalarType, treatAsType);
}

export interface BaseResolverInterface<T> {
	hookManager?: HookManager<T>;
}

export function createBaseResolver<T, O>(
	gqlEntityType: GraphqlEntityType<T, O>,
	provider: BackendProvider<O>
): abstract new () => BaseResolverInterface<T> {
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

	const entityFields = metadata.fields.filter((field) => field.target === gqlEntityType);
	const enumSet = new Set(metadata.enums.map((enumMetadata) => enumMetadata.enumObj));

	let acl = AclMap.get(gqlEntityType.name);
	if (!acl) {
		logger.warn(
			`Could not find ACL for ${gqlEntityType.name} - only administrative users will be able to access this entity`
		);
		acl = {};
	}

	EntityMetadataMap.set(objectNames[0].name, {
		provider,
		entity: objectNames[0],
		fields: entityFields,
		enums: metadata.enums,
		accessControlList: acl,
	});

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
	abstract class BaseResolver implements BaseResolverInterface<T> {
		public hookManager?: HookManager<T>;

		// List
		@Query(() => [gqlEntityType], {
			name: plural.charAt(0).toLowerCase() + plural.substring(1),
		})
		public async list(
			@Arg('filter', () => ListInputFilterArgs, { nullable: true })
			filter: Partial<O>,
			@Arg('pagination', () => PaginationInputArgs, { nullable: true })
			pagination: PaginationOptions,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: AuthorizationContext
		): Promise<Array<T | null>> {
			const params = {
				args: { filter, pagination },
				info,
				context,
			};
			const hookParams = this.hookManager
				? await this.hookManager.runHooks(HookRegister.BEFORE_READ, params)
				: params;

			const result = await QueryManager.find({
				entityName: gqlEntityTypeName,
				filter: hookParams.args?.filter as Partial<O>,
				pagination: hookParams.args?.pagination as PaginationOptions,
			});

			if (gqlEntityType.fromBackendEntity) {
				const { fromBackendEntity } = gqlEntityType;
				const results = result.map((entity: O) => fromBackendEntity.call(gqlEntityType, entity));

				const { entities } = this.hookManager
					? await this.hookManager.runHooks(HookRegister.AFTER_READ, {
							...hookParams,
							entities: results,
					  })
					: { entities: results };

				return entities ?? results;
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
			@Ctx() context: AuthorizationContext
		): Promise<T | null> {
			const params = {
				args: { filter: { id } },
				info,
				context,
			};

			const hookParams = this.hookManager
				? await this.hookManager.runHooks(HookRegister.BEFORE_READ, params)
				: params;

			const result = await provider.findOne(hookParams.args?.filter);

			if (result && gqlEntityType.fromBackendEntity) {
				const entity = gqlEntityType.fromBackendEntity.call(gqlEntityType, result);

				const { entities = [] } = this.hookManager
					? await this.hookManager.runHooks(HookRegister.AFTER_READ, {
							...hookParams,
							entities: [entity],
					  })
					: { entities: [entity] };

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
		// Create many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `create${plural}` })
		async createMany(
			@Arg('input', () => InsertManyInputArgs) createItems: any
		): Promise<Array<T | null>> {
			// Transform attributes which are one-to-many / many-to-many relationships
			let createData = createItems.data;

			// The type may want to further manipulate the input before passing it to the provider.
			if (gqlEntityType.mapInputForInsertOrUpdate) {
				const { mapInputForInsertOrUpdate } = gqlEntityType;
				createData = createData.map((createItem: any) => mapInputForInsertOrUpdate(createItem));
			}

			const entities = await provider.createMany(createData);
			if (gqlEntityType.fromBackendEntity) {
				const { fromBackendEntity } = gqlEntityType;
				return entities.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
			}

			return entities as any[];
		}

		// Create
		@Mutation((returns) => gqlEntityType, { name: `create${gqlEntityTypeName}` })
		async createItem(@Arg('data', () => InsertInputArgs) createItemData: any): Promise<T | null> {
			// Transform attributes which are one-to-many / many-to-many relationships
			let createData = createItemData;

			// The type may want to further manipulate the input before passing it to the provider.
			if (gqlEntityType.mapInputForInsertOrUpdate) {
				createData = gqlEntityType.mapInputForInsertOrUpdate(createData);
			}

			// Save!
			const entity = await provider.createOne(createData);

			if (gqlEntityType.fromBackendEntity) {
				return gqlEntityType.fromBackendEntity.call(gqlEntityType, entity);
			}

			return entity as any; // they're saying there's no need to map, so types don't align, but we trust the dev.
		}

		// Update many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `update${plural}` })
		async updateMany(
			@Arg('input', () => UpdateManyInputArgs) updateItems: any
		): Promise<Array<T | null>> {
			// Transform attributes which are one-to-many / many-to-many relationships
			let updateData = updateItems.data;

			// The type may want to further manipulate the input before passing it to the provider.
			if (gqlEntityType.mapInputForInsertOrUpdate) {
				const { mapInputForInsertOrUpdate } = gqlEntityType;
				updateData = updateData.map((updateItem: any) => mapInputForInsertOrUpdate(updateItem));
			}

			const entities = await provider.updateMany(updateData);
			if (gqlEntityType.fromBackendEntity) {
				const { fromBackendEntity } = gqlEntityType;
				return entities.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
			}

			return entities as any[];
		}

		// CreateOrUpdate many items in a transaction
		@Mutation((returns) => [gqlEntityType], { name: `createOrUpdateMany${plural}` })
		async createOrUpdateMany(
			@Arg('input', () => CreateOrUpdateManyInputArgs) items: any
		): Promise<Array<T | null>> {
			// Transform attributes which are one-to-many / many-to-many relationships
			let data = items.data;

			// The type may want to further manipulate the input before passing it to the provider.
			if (gqlEntityType.mapInputForInsertOrUpdate) {
				const { mapInputForInsertOrUpdate } = gqlEntityType;
				data = data.map((updateItem: any) => mapInputForInsertOrUpdate(updateItem));
			}

			const entities = await provider.createOrUpdateMany(data);
			if (gqlEntityType.fromBackendEntity) {
				const { fromBackendEntity } = gqlEntityType;
				return entities.map((entity) => fromBackendEntity.call(gqlEntityType, entity));
			}

			return entities as any[];
		}

		// Update
		@Mutation((returns) => gqlEntityType, { name: `update${gqlEntityTypeName}` })
		async update(@Arg('data', () => UpdateInputArgs) updateItemData: any): Promise<T | null> {
			// Transform attributes which are one-to-many / many-to-many relationships
			let updateData = updateItemData;
			// The type may want to further manipulate the input before passing it to the provider.
			if (gqlEntityType.mapInputForInsertOrUpdate) {
				updateData = gqlEntityType.mapInputForInsertOrUpdate(updateData);
			}

			// Update and save!
			const result = await provider.updateOne(updateItemData.id, updateData);

			if (gqlEntityType.fromBackendEntity) {
				const { fromBackendEntity } = gqlEntityType;
				return fromBackendEntity.call(gqlEntityType, result);
			}

			return result as any; // they're saying there's no need to map, so types don't align, but we trust the dev.
		}

		// Delete
		@Mutation((returns) => Boolean, { name: `delete${gqlEntityTypeName}` })
		async deleteItem(
			@Arg('id', () => ID) id: string,
			@Info() info: GraphQLResolveInfo,
			@Ctx() context: AuthorizationContext
		) {
			const params = {
				args: { filter: { id } },
				info,
				context,
			};

			const beforeParams = this.hookManager
				? await this.hookManager.runHooks(HookRegister.BEFORE_DELETE, params)
				: params;

			const success = await provider.deleteOne(beforeParams.args?.filter);

			this.hookManager
				? await this.hookManager.runHooks(HookRegister.AFTER_DELETE, {
						...params,
				  })
				: params;

			return success;
		}
	}

	return WritableBaseResolver;
}
