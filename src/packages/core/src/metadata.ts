import { DirectiveLocation } from 'graphql';
import { logger } from '@exogee/logger';

import { SchemaBuilder } from './schema-builder';
import { BackendProvider, FieldMetadata, Filter, GetTypeFunction, Resolver, Sort } from './types';
import { FieldOptions } from './decorators';

export interface EntityMetadata<G = unknown, D = unknown> {
	type: 'entity';
	name: string;
	description?: string;
	plural: string;
	target: { new (...args: any[]): G };
	provider?: BackendProvider<D>;
	fields: { [key: string]: FieldMetadata<G, D> };
	directives?: Record<string, unknown>;

	// The field that is treated as the primary key. Defaults to `id` if nothing is specified.
	primaryKeyField?: keyof G;

	apiOptions?: {
		// This means that the entity should not be given the default list, find one, create, update, and delete
		// operations. This is useful for entities that you're defining the API for yourself. Setting this to true
		// enables excludeFromFiltering as well.
		excludeFromBuiltInOperations?: boolean;

		// This means that the entity should not be given the default create, update, and delete operations. This is
		// useful for entities that are read only or are managed by some other system.
		excludeFromBuiltInWriteOperations?: boolean;

		// This means that the entity should appear in the API but not have any options to filter queries
		// by fields. This is useful for entities that are not backed by a fully fledged provider or are
		// otherwise dynamically generated.
		excludeFromFiltering?: boolean;
	};

	adminUIOptions?: {
		// Specifies the default filter used in the Admin UI when viewing the list view.
		// Users can still override this filter, but this is the default. This has no
		// impact on the API, purely how entities are displayed in the Admin UI.
		defaultFilter?: Filter<G>;

		// Specifies the default sort used in the Admin UI when viewing the list view.
		// Users can still override this sort, but this is the default. This has no
		// impact on the API, purely how entities are displayed in the Admin UI.
		defaultSort?: Partial<Record<keyof G, Sort>>;

		// Specifies how many entities should be requested per page during a CSV export.
		// If not set, the default is 200.
		exportPageSize?: number;

		// If true, the entity will not show up in the side bar (on the left when you log in).
		// If a property on another entity references this entity, it will still show up in
		// the field of that entity using its display property.
		hideInSideBar?: boolean;

		// If true, properties that reference this entity from other entities will not be able
		// to be filtered in the list view for those entities.
		hideInFilterBar?: boolean;

		// If true, the entity will not show up in the list view in the Admin UI. This is useful
		// for entities that are managed by some other system or we don't want a user to see in the
		// adminUI.
		hideInDetailForm?: boolean;

		// Specifies what field on this entity should be used to summarise it in the Admin UI when
		// referenced from other entities, e.g. if a Task in a to-do list application has an 'assigned to'
		// field that references User, if the summary field on User is set to "name", then users in the
		// task list in the admin area will be shown by their name.
		//
		// If no summary field is set for an entity, we default to showing the primary key field.
		summaryField?: Extract<keyof G, string>;

		// If true, the entity will not be editable in the Admin UI. This is useful for entities
		// that are managed by some other system or we don't want a user to update from the adminUI.
		readonly?: boolean;
	};
}

export function isInputMetadata<G = unknown, D = unknown>(
	value: unknown
): value is InputTypeMetadata<G, D> {
	const test = value as InputTypeMetadata<G, D>;

	return (
		test?.type === 'inputType' &&
		typeof test?.name === 'string' &&
		typeof test?.target === 'function'
	);
}

export function isEntityMetadata<G = unknown, D = unknown>(
	value: unknown
): value is EntityMetadata<G, D> {
	const test = value as EntityMetadata<G, D>;

	return (
		test?.type === 'entity' && typeof test?.name === 'string' && typeof test?.target === 'function'
	);
}

export interface EnumMetadata<TEnum extends object> {
	type: 'enum';
	target: object;
	name: string;
	description?: string;
	valuesConfig?: EnumValuesConfig<TEnum>;
}

export function isEnumMetadata<TEnum extends object>(value: unknown): value is EnumMetadata<TEnum> {
	const test = value as EnumMetadata<TEnum>;

	return (
		test?.type === 'enum' && typeof test?.name === 'string' && typeof test?.target === 'object'
	);
}

export type EnumValuesConfig<TEnum extends object> = Partial<
	Record<keyof TEnum, { description?: string; deprecationReason?: string }>
>;

export interface InputTypeMetadata<G = unknown, D = unknown> {
	type: 'inputType';
	name: string;
	description?: string;
	fields: { [key: string]: FieldMetadata<G, D> };
	target: G;
}

export type CollectEnumInformationArgs<TEnum extends object> = Omit<EnumMetadata<TEnum>, 'type'>;

export type CollectEntityInformationArgs<G = unknown, D = unknown> = Omit<
	EntityMetadata<G, D>,
	'type' | 'fields'
>;

export type CollectInputTypeInformationArgs<G = unknown, D = unknown> = Omit<
	InputTypeMetadata<G, D>,
	'type' | 'fields'
>;

export interface ArgMetadata {
	type: GetTypeFunction;
	description?: string;
	defaultValue?: unknown;
	deprecationReason?: string;
	nullable?: boolean;
}

// isArgMetadata is a type guard for ArgMetadata
export function isArgMetadata(value: unknown): value is ArgMetadata {
	const test = value as ArgMetadata;
	return typeof test?.type === 'function';
}

export interface ArgsMetadata {
	[key: string]: ArgMetadata | GetTypeFunction;
}

export interface DirectiveMetadata {
	name: string;
	type: 'directive';
	description?: string;
	args?: ArgsMetadata;
	isRepeatable?: boolean;
	locations: DirectiveLocation[];
}

export type CollectDirectiveTypeInformationArgs = Omit<DirectiveMetadata, 'type'>;

export function isUnionMetadata(value: unknown): value is UnionMetadata {
	const test = value as UnionMetadata;

	return (
		test?.type === 'union' && typeof test?.name === 'string' && typeof test?.target === 'object'
	);
}

export interface UnionMetadata {
	name: string;
	type: 'union';
	target: object;
	description?: string;
	getTypes: GetTypeFunction;
}

export type CollectUnionTypeInformationArgs = Omit<UnionMetadata, 'type' | 'target'>;

export interface AdditionalOperationInformation {
	name: string;
	getType: () => any;
	resolver: Resolver;
	args?: ArgsMetadata;
	description?: string;
}

export type MetadataType =
	| EntityMetadata<any, any>
	| EnumMetadata<any>
	| InputTypeMetadata<any, any>
	| DirectiveMetadata
	| UnionMetadata;

class Metadata {
	private metadataByType = new Map<unknown, MetadataType>();
	private nameLookupCache = new Map<string, MetadataType>();

	private additionalQueriesLookup = new Map<string, AdditionalOperationInformation>();
	private additionalMutationsLookup = new Map<string, AdditionalOperationInformation>();

	// We have to lazy load this because fields get their decorators run first. This means
	// when the field creates the entity, we need to not look at the name until after the
	// entity is actually decorated, which will then override the names.
	private ensureNameLookupCachePopulated() {
		if (this.nameLookupCache.size === 0) {
			for (const value of this.metadataByType.values()) {
				if (this.nameLookupCache.has(value.name)) {
					throw new Error(
						`Unexpected Error: duplicate entity name (${value.name}) in metadata map`
					);
				}

				this.nameLookupCache.set(value.name, value);
			}
		}
	}

	public collectEntityInformation<G = unknown, D = unknown>(
		args: CollectEntityInformationArgs<G, D>
	) {
		// In most cases the entity info will already be in the map because field decorators run
		// before class decorators. Override what we know our source of truth to be and keep rolling.
		let existingMetadata = this.metadataByType.get(args.target) as EntityMetadata<G, D>;
		if (!existingMetadata) {
			existingMetadata = {
				type: 'entity',
				name: args.name,
				plural: args.plural,
				target: args.target,
				fields: {},
			};
		}
		if (
			args.adminUIOptions?.summaryField &&
			existingMetadata.adminUIOptions?.summaryField &&
			existingMetadata.adminUIOptions.summaryField !== args.adminUIOptions.summaryField
		) {
			throw new Error(
				`Entities can only declare one summary field. An attempt was made to set ${args.adminUIOptions?.summaryField} as the summary field for ${args.name} while ${existingMetadata.adminUIOptions.summaryField} is already set.`
			);
		}

		// Copy the new info we have over into the metadata store.
		existingMetadata = {
			...existingMetadata,
			...args,
			adminUIOptions: {
				...existingMetadata.adminUIOptions,
				...args.adminUIOptions,
			},
		};

		this.metadataByType.set(args.target, existingMetadata);
	}

	public collectProviderInformationForEntity<G = unknown, D = unknown>(args: {
		provider: BackendProvider<D>;
		target: any;
	}) {
		let existingMetadata = this.metadataByType.get(args.target) as EntityMetadata<G, D>;
		if (!existingMetadata) {
			existingMetadata = {
				type: 'entity',
				name: 'UnknownEntity',
				plural: 'UnknownEntity',
				target: args.target,
				fields: {},
			};
		}

		existingMetadata.provider = args.provider;

		this.metadataByType.set(args.target, existingMetadata);
	}

	public collectFieldInformation<G = unknown, D = unknown>(
		args: FieldOptions &
			Pick<FieldMetadata<G, D>, 'target' | 'name' | 'getType' | 'relationshipInfo'>
	) {
		// We need to refer to the constructor here because the class doesn't exist yet.
		// Later when we collect entity information this will line up as the same type.
		const entity = (args.target as any).constructor;

		// This could be an input type or an entity, but we'll default it to entity for now.
		let existingMetadata = this.metadataByType.get(entity) as EntityMetadata<G, any>;
		if (!existingMetadata) {
			existingMetadata = {
				// This could be overwritten later, for example to an Input Type, but we'll default it to 'entity' for the time being because it's the most likely.
				type: 'entity',

				// This name will probably be overwritten later.
				name: entity.name ?? 'UnknownType',
				plural: entity.plural ?? 'UnknownTypePlural',
				target: args.target,
				fields: {},
			};
		}

		existingMetadata.fields[args.name] = args;

		if (args.primaryKeyField) {
			if (existingMetadata.primaryKeyField && existingMetadata.primaryKeyField !== args.name) {
				throw new Error(
					`Entities can only declare one primary key field. An attempt was made to set ${args.name} as the primary key for ${entity.name} while ${entity.primaryKeyField} is already set.`
				);
			}

			existingMetadata.primaryKeyField = args.name as keyof G;
		}

		if (args.adminUIOptions?.summaryField) {
			if (
				existingMetadata.adminUIOptions?.summaryField &&
				existingMetadata.adminUIOptions.summaryField !== args.name
			) {
				throw new Error(
					`Entities can only declare one summary field. An attempt was made to set ${args.name} as the summary field for ${entity.name} while ${entity.adminUiOptions.summaryField} is already set.`
				);
			}

			existingMetadata.adminUIOptions = {
				...existingMetadata.adminUIOptions,
				summaryField: args.name as Extract<keyof G, string>,
			};
		}
		this.metadataByType.set(entity, existingMetadata);
	}

	public collectEnumInformation<TEnum extends object>(args: CollectEnumInformationArgs<TEnum>) {
		if (this.metadataByType.has(args.target)) {
			logger.warn(
				{
					existing: this.metadataByType.get(args.target),
					new: args,
				},
				`Enum with name ${args.name} already exists in metadata map. Overwriting with latest values provided.`
			);
		}

		this.metadataByType.set(args.target, {
			type: 'enum',
			...args,
		});
	}

	public collectInputTypeInformation<G = unknown, D = unknown>(
		args: CollectInputTypeInformationArgs<G, D>
	) {
		let existingMetadata = this.metadataByType.get(args.target);

		if (!existingMetadata) {
			existingMetadata = {
				type: 'inputType',
				name: args.name,
				description: args.description,
				target: args.target,

				fields: {},
			};
		}

		Object.assign(existingMetadata, args);

		// Ensure the type is set to inputType as it is set to entity by default
		existingMetadata.type = 'inputType';

		this.metadataByType.set(args.target, existingMetadata);
	}

	public collectDirectiveTypeInformation(args: CollectDirectiveTypeInformationArgs) {
		if (this.metadataByType.has(args.name)) {
			throw new Error(`Directive with name ${args.name} already exists in metadata map.`);
		}

		this.metadataByType.set(args.name, {
			type: 'directive',
			args: {},
			isRepeatable: false,
			...args,
		});
	}

	public collectUnionTypeInformation(args: CollectUnionTypeInformationArgs) {
		const target = {}; // We need a target so it can be used in getTypes, should we create a union class?

		this.metadataByType.set(target, {
			type: 'union',
			target,
			...args,
		});

		return target;
	}

	// get a list of all the entity metadata in the metadata map
	public *entities() {
		for (const value of this.metadataByType.values()) {
			if (value.type === 'entity') yield value;
		}
	}

	public *entityNames() {
		for (const entity of this.entities()) {
			yield entity.name;
		}
	}

	// get a list of all the enums in the metadata map
	public *enums() {
		for (const value of this.metadataByType.values()) {
			if (value.type === 'enum') yield value;
		}
	}

	public *inputTypes() {
		for (const value of this.metadataByType.values()) {
			if (value.type === 'inputType') yield value;
		}
	}

	public *additionalQueries() {
		for (const value of this.additionalQueriesLookup.values()) {
			yield value;
		}
	}

	public *additionalMutations() {
		for (const value of this.additionalMutationsLookup.values()) {
			yield value;
		}
	}

	// get a list of all the enums in the metadata map
	public *directives() {
		for (const value of this.metadataByType.values()) {
			if (value.type === 'directive') yield value;
		}
	}

	// check if the metadata map has a specific name
	public hasName(name: string) {
		this.ensureNameLookupCachePopulated();

		return this.nameLookupCache.has(name);
	}

	public getTypeForName(name: string) {
		this.ensureNameLookupCachePopulated();

		return this.nameLookupCache.get(name);
	}

	public metadataForType(type: unknown) {
		if (Array.isArray(type)) {
			return this.metadataByType.get(type[0]);
		}

		return this.metadataByType.get(type);
	}

	public hasEntity(type: unknown) {
		return this.metadataByType.get(type)?.type === 'entity';
	}

	public hasEnum(type: unknown) {
		return this.metadataByType.get(type)?.type === 'enum';
	}

	public hasInputType(type: unknown) {
		return this.metadataByType.get(type)?.type === 'inputType';
	}

	public get typeCounts() {
		const counts = {
			entity: 0,
			enum: 0,
			inputType: 0,
			directive: 0,
			union: 0,
		};

		for (const value of this.metadataByType.values()) {
			counts[value.type]++;
		}

		return counts;
	}

	// get the metadata for a specific entity
	public getEntityByName<G = unknown, D = unknown>(name: string): EntityMetadata<G, D> | undefined {
		const meta = this.getTypeForName(name);

		if (!isEntityMetadata(meta)) return undefined;

		return meta;
	}

	// check if the metadata map has a specific enum
	public getEnumByName<TEnum extends object = object>(
		name: string
	): EnumMetadata<TEnum> | undefined {
		const meta = this.getTypeForName(name);

		if (!isEnumMetadata(meta)) return undefined;

		return meta;
	}

	public getInputTypeByName(name: string) {
		const meta = this.getTypeForName(name);

		if (!isInputMetadata(meta)) return undefined;

		return meta;
	}

	// look up the name of an entity or enum by its type
	public nameForObjectType(type: unknown) {
		return this.metadataByType.get(type)?.name;
	}

	public primaryKeyFieldForEntity(entity: EntityMetadata<any, any>) {
		return String(entity.primaryKeyField ?? 'id');
	}

	// While an entity might have a field called something like 'id', the filter will have keys
	// like 'id_in'. This function can be used to look up the correct field metadata in these cases.
	public fieldMetadataForFilterKey(
		entity: EntityMetadata<any, any>,
		filterKey: string
	): FieldMetadata<any, any> | undefined {
		// If it's a direct match, go ahead and bail for performance.
		if (entity.fields[filterKey]) return entity.fields[filterKey];

		// Ok, let's look it up by pulling the last `_` off the key and seeing if it matches a field.
		const keyParts = filterKey.split('_');
		const key = keyParts.slice(0, keyParts.length - 1).join('_');

		// Let's validate that the filter operation is one we recognise.
		if (SchemaBuilder.isValidFilterOperation(keyParts[keyParts.length - 1])) {
			// Ok, that'll be the field name.
			return entity.fields[key];
		}

		return undefined;
	}

	public addQuery(args: {
		name: string;
		getType: GetTypeFunction;
		resolver: Resolver;
		args?: ArgsMetadata;
		description?: string;
		intentionalOverride?: boolean;
	}) {
		if (this.additionalQueriesLookup.has(args.name) && !args.intentionalOverride) {
			throw new Error(
				`Query with name ${args.name} already exists and this is not an intentional override`
			);
		}

		this.additionalQueriesLookup.set(args.name, args);
	}

	public addMutation(args: {
		name: string;
		getType: GetTypeFunction;
		resolver: Resolver;
		args?: ArgsMetadata;
		description?: string;
		intentionalOverride?: boolean;
	}) {
		if (this.additionalMutationsLookup.has(args.name) && !args.intentionalOverride) {
			throw new Error(
				`Mutation with name ${args.name} already exists and this is not an intentional override`
			);
		}

		// We'll copy it here just to be sure it doesn't get mutated later without our knowledge.
		this.additionalMutationsLookup.set(args.name, { ...args });
	}

	public clear() {
		this.metadataByType.clear();
		this.nameLookupCache.clear();
		this.additionalMutationsLookup.clear();
		this.additionalQueriesLookup.clear();
	}
}

export const graphweaverMetadata = new Metadata();
