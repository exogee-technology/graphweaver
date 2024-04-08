import { BaseDataEntity, GraphQLFieldResolver } from '.';
import { BackendProvider, FieldMetadata, Filter } from './types';
import { logger } from '@exogee/logger';

export interface EntityMetadata<G, D extends BaseDataEntity> {
	type: 'entity';
	name: string;
	description?: string;
	plural: string;
	target: G;
	provider?: BackendProvider<D, G>;
	fields: FieldMetadata<G>[];

	apiOptions?: {
		// This means that the entity should not be given the default list, find one, create, update, and delete
		// operations. This is useful for entities that you're defining the API for yourself. Setting this to true
		// enables excludeFromFiltering as well.
		excludeFromBuiltInOperations?: boolean;

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

		// If true, the entity will not show up in the side bar (on the left when you log in).
		// If a property on another entity references this entity, it will still show up in
		// the field of that entity using its display property.
		hideInSideBar?: boolean;

		// If true, properties that reference this entity from other entities will not be able
		// to be filtered in the list view for those entities. This is
		hideInFilterBar?: boolean;
	};
}

export function isEntityMetadata<G, D extends BaseDataEntity>(
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

export interface InputTypeMetadata<G> {
	type: 'inputType';
	name: string;
	description?: string;
	fields: FieldMetadata<G>[];
	target: G;
}

export type CollectEnumInformationArgs<TEnum extends object> = Omit<EnumMetadata<TEnum>, 'type'>;

export type CollectEntityInformationArgs<G, D extends BaseDataEntity> = Omit<
	EntityMetadata<G, D>,
	'type' | 'fields'
>;

export type CollectInputTypeInformationArgs<G> = Omit<InputTypeMetadata<G>, 'type' | 'fields'>;

export interface AdditionalOperationInformation {
	name: string;
	getType: () => any;
	resolver: GraphQLFieldResolver<any, any, any, unknown>;
	description?: string;
}

class Metadata {
	private metadataByType = new Map<
		unknown,
		EntityMetadata<unknown, any> | EnumMetadata<any> | InputTypeMetadata<unknown>
	>();
	private nameLookupCache = new Map<
		string,
		EntityMetadata<unknown, any> | EnumMetadata<any> | InputTypeMetadata<unknown>
	>();

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

	public collectEntityInformation<G, D extends BaseDataEntity>(
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
				fields: [],
			};
		}

		// Copy the new info we have over into the metadata store. This is a shallow
		// copy, but that should be fine in our case.
		Object.assign(existingMetadata, args);

		this.metadataByType.set(args.target, existingMetadata);
	}

	public collectProviderInformationForEntity<G, D extends BaseDataEntity>(args: {
		provider: BackendProvider<D, G>;
		target: G;
	}) {
		let existingMetadata = this.metadataByType.get(args.target) as EntityMetadata<G, D>;
		if (!existingMetadata) {
			existingMetadata = {
				type: 'entity',
				name: 'UnknownEntity',
				plural: 'UnknownEntity',
				target: args.target,
				fields: [],
			};
		}

		existingMetadata.provider = args.provider;

		this.metadataByType.set(args.target, existingMetadata);
	}

	public collectFieldInformation<G>(args: FieldMetadata<G>) {
		// We need to refer to the constructor here because the class doesn't exist yet.
		// Later when we collect entity information this will line up as the same type.
		const entity = (args.target as any).constructor;

		let existingMetadata = this.metadataByType.get(entity) as EntityMetadata<G, any>;
		if (!existingMetadata) {
			existingMetadata = {
				// This could be overwritten later, for example to an Input Type, but we'll default it to 'entity' for the time being because it's the most likely.
				type: 'entity',

				// This name will probably be overwritten later.
				name: entity.name ?? 'UnknownEntity',
				plural: entity.plural ?? 'UnknownEntityPlural',
				target: args.target,
				fields: [],
			};
		}

		existingMetadata.fields.push(args);

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

	public collectInputTypeInformation<G>(args: CollectInputTypeInformationArgs<G>) {
		let existingMetadata = this.metadataByType.get(args.target);

		if (!existingMetadata) {
			existingMetadata = {
				type: 'inputType',
				name: args.name,
				description: args.description,
				target: args.target,

				fields: [],
			};
		}

		Object.assign(existingMetadata, args);

		this.metadataByType.set(args.target, existingMetadata);
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
		};

		for (const value of this.metadataByType.values()) {
			counts[value.type]++;
		}

		return counts;
	}

	// get the metadata for a specific entity
	public getEntityByName<G, D extends BaseDataEntity>(
		name: string
	): EntityMetadata<G, D> | undefined {
		const meta = this.getTypeForName(name);

		if (meta?.type !== 'entity') return undefined;

		return meta as EntityMetadata<G, D>;
	}

	// check if the metadata map has a specific enum
	public getEnumByName<TEnum extends object = object>(
		name: string
	): EnumMetadata<TEnum> | undefined {
		const meta = this.getTypeForName(name);

		if (meta?.type !== 'enum') return undefined;

		return meta;
	}

	public getInputTypeByName(name: string) {
		const meta = this.getTypeForName(name);

		if (meta?.type !== 'inputType') return undefined;

		return meta;
	}

	// look up the name of an entity or enum by its type
	public nameForObjectType(type: unknown) {
		return this.metadataByType.get(type)?.name;
	}

	public addQuery(args: {
		name: string;
		getType: () => any;
		resolver: GraphQLFieldResolver<any, any, any, unknown>;
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
		getType: () => any;
		resolver: () => any;
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
