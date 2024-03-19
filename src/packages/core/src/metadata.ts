import { BaseDataEntity } from '.';
import { BackendProvider, FieldMetadata, Filter } from './common/types';

export interface EntityMetadata<G, D extends BaseDataEntity> {
	type: 'entity';
	name: string;
	plural: string;
	target: G;
	provider?: BackendProvider<D, G>;
	fields: FieldMetadata<G>[];
	defaultFilter?: Filter<G>;
	hideFromDisplay?: boolean;
	hideFromFilterBar?: boolean;
}

export interface EnumMetadata<TEnum extends object> {
	type: 'enum';
	target: object;
	name: string;
	description?: string;
	valuesConfig?: EnumValuesConfig<TEnum>;
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
	'type' | 'provider' | 'fields'
>;

export type CollectInputTypeInformationArgs<G> = Omit<InputTypeMetadata<G>, 'type' | 'fields'>;

class Metadata {
	private metadataByType = new Map<
		unknown,
		EntityMetadata<unknown, any> | EnumMetadata<any> | InputTypeMetadata<unknown>
	>();
	private nameLookupCache = new Map<
		string,
		EntityMetadata<unknown, any> | EnumMetadata<any> | InputTypeMetadata<unknown>
	>();

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
		const existingMetadata = this.metadataByType.get(args.target);
		if (existingMetadata?.type === 'entity') {
			existingMetadata.name = args.name;
			existingMetadata.plural = args.plural;
		} else if (!existingMetadata) {
			this.metadataByType.set(args.target, {
				type: 'entity',
				name: args.name,
				plural: args.plural,
				target: args.target,
				fields: [],
			});
		} else {
			throw new Error(
				'Unexpected Error: Tried to collect entity information on a type that is not an entity'
			);
		}
	}

	public collectProviderInformationForEntity<G, D extends BaseDataEntity>(args: {
		provider: BackendProvider<D, G>;
		target: G;
	}) {
		const existingMetadata = this.metadataByType.get(args.target);
		if (existingMetadata?.type === 'entity') {
			existingMetadata.provider = args.provider;
		} else if (!existingMetadata) {
			this.metadataByType.set(args.target, {
				type: 'entity',
				name: 'UnknownEntity',
				plural: 'UnknownEntity',
				target: args.target,
				provider: args.provider,
				fields: [],
			});
		} else {
			throw new Error(
				'Unexpected Error: Tried to collect provider information on a type that is not an entity'
			);
		}
	}

	public collectFieldInformation<G>(args: FieldMetadata<G>) {
		const existingMetadata = this.metadataByType.get(args.target);
		if (existingMetadata?.type === 'entity' || existingMetadata?.type === 'inputType') {
			existingMetadata.fields.push(args);
		} else {
			this.metadataByType.set(args.target, {
				// This could be overwritten later, for example to an Entity, but we'll default it to 'inputType' for the time being because it's the simplest.
				type: 'inputType',

				// This name will probably be overwritten later.
				name: (args.target as any).name ?? 'UnknownEntity',
				target: args.target,
				fields: [args],
			});
		}
	}

	public collectEnumInformation<TEnum extends object>(args: CollectEnumInformationArgs<TEnum>) {
		if (this.metadataByType.has(args.target)) {
			throw new Error(`Unexpected Error: duplicate enum (${args.name}) in metadata`);
		}

		this.metadataByType.set(args.target, {
			type: 'enum',
			...args,
		});
	}

	public collectInputTypeInformation<G>(args: CollectInputTypeInformationArgs<G>) {
		const existingMetadata = this.metadataByType.get(args.target);
		if (existingMetadata?.type === 'inputType') {
			existingMetadata.name = args.name;
			existingMetadata.description = args.description;
		} else if (!existingMetadata) {
			this.metadataByType.set(args.target, {
				type: 'inputType',
				name: args.name,
				description: args.description,
				fields: [],
				target: args.target,
			});
		} else {
			throw new Error(
				'Unexpected Error: Tried to collect input type information on a type that is not an input type'
			);
		}
	}

	// get a list of all the entity metadata in the metadata map
	public *entities() {
		for (const value of this.metadataByType.values()) {
			if (value.type === 'entity') yield value;
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

	// get the metadata for a specific entity
	public getEntity<G, D extends BaseDataEntity>(name: string): EntityMetadata<G, D> {
		const meta = this.getTypeForName(name);

		if (!meta) {
			throw new Error(`Unexpected Error: entity (${name}) not found in metadata map`);
		}
		if (meta.type !== 'entity') {
			throw new Error(`Unexpected Error: entity (${name}) is '${meta.type}' not an entity`);
		}

		return meta as EntityMetadata<G, D>;
	}

	// check if the metadata map has a specific enum
	public getEnum<TEnum extends object = object>(name: string): EnumMetadata<TEnum> {
		const meta = this.getTypeForName(name);

		if (!meta) {
			throw new Error(`Unexpected Error: enum (${name}) not found in metadata map`);
		}
		if (meta.type !== 'enum') {
			throw new Error(`Unexpected Error: enum (${name}) is '${meta.type}' not an enum`);
		}

		return meta;
	}

	public getInputType(name: string) {
		const meta = this.getTypeForName(name);

		if (!meta) {
			throw new Error(`Unexpected Error: input type (${name}) not found in metadata map`);
		}
		if (meta.type !== 'inputType') {
			throw new Error(`Unexpected Error: input type (${name}) is '${meta.type}' not an input type`);
		}

		return meta;
	}

	// look up the name of an entity or enum by its type
	public nameForObjectType(type: unknown) {
		return this.metadataByType.get(type)?.name;
	}

	public clear() {
		this.metadataByType.clear();
		this.nameLookupCache.clear();
	}
}

export const graphweaverMetadata = new Metadata();
