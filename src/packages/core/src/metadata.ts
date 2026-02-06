import { logger } from '@exogee/logger';
import { DirectiveLocation, OperationDefinitionNode } from 'graphql';
import { version } from '../package.json';

import { FieldOptions } from './decorators';
import { HookRegister } from './hook-manager';
import { allOperations } from './operations';
import {
	AdminUIFilterType,
	BackendProvider,
	CreateOrUpdateHookParams,
	DeleteManyHookParams,
	FieldMetadata,
	Filter,
	GetTypeFunction,
	ReadHookParams,
	Resolver,
	Sort,
} from './types';

export type EntityHookFunctionCreateOrUpdate<G = unknown> = (
	params: CreateOrUpdateHookParams<G>
) => Promise<Partial<G>> | Partial<G>;
export type EntityHookFunctionDelete<G = unknown> = (
	params: DeleteManyHookParams<G>
) => Promise<Partial<G>> | Partial<G>;
export type EntityHookFunctionRead<G = unknown> = (
	params: ReadHookParams<G>
) => Promise<Partial<G>> | Partial<G>;

export interface HookRegistration<G> {
	[HookRegister.BEFORE_CREATE]?: EntityHookFunctionCreateOrUpdate<G>[];
	[HookRegister.AFTER_CREATE]?: EntityHookFunctionCreateOrUpdate<G>[];
	[HookRegister.BEFORE_UPDATE]?: EntityHookFunctionCreateOrUpdate<G>[];
	[HookRegister.AFTER_UPDATE]?: EntityHookFunctionCreateOrUpdate<G>[];
	[HookRegister.BEFORE_DELETE]?: EntityHookFunctionDelete<G>[];
	[HookRegister.AFTER_DELETE]?: EntityHookFunctionDelete<G>[];
	[HookRegister.BEFORE_READ]?: EntityHookFunctionRead<G>[];
	[HookRegister.AFTER_READ]?: EntityHookFunctionRead<G>[];
}

export interface EntityMetadata<G = unknown, D = unknown> {
	type: 'entity';
	name: string;
	description?: string;
	plural: string;
	target: { new (...args: any[]): G };
	provider?: BackendProvider<D>;
	fields: { [key: string]: FieldMetadata<G, D> };
	directives?: Record<string, unknown>;
	hooks?: HookRegistration<G>;

	// The field that is treated as the primary key. Defaults to `id` if nothing is specified.
	primaryKeyField?: keyof G;

	apiOptions?: {
		// By default we expect the underlying data provider to generate the primary keys for entities, e.g. an
		// identity field in a database. This allows consistency and centralised control. It is, however, sometimes
		// nice to allow for client side ID creation, particularly with uuid IDs, or in situations like chat programs
		// where you want the client to know the ID before it even does the initial mutation to create the entity.
		// In these cases, you'll want to set this to true. The schema will then emit the primary key field as a
		// required field in calls to create the entity. If you call createOrUpdate with these entities, it will
		// be less efficient because we have to go to the underlying datasource to see if the entity exists before
		// we can decide if it was a create or if it was an update that you meant.
		clientGeneratedPrimaryKeys?: boolean;

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

		// This means that there will be no recorded telemetry for this entity when it's requested from the Admin UI. This is useful for entities
		// that are managed by some other system or we don't want to record telemetry for.
		//
		// Note that in order to achieve this from your own front ends, you need to set the `X-GRAPHWEAVER-SUPPRESS-TRACING: true` header on the requests, which is what this option instructs the admin UI to do for you.
		excludeFromTracing?: boolean;

		// If this entity will appear in multiple subgraphs, a federation router will need them to have unique names.
		// A prime example of this in Graphweaver itself is the Media entity, which shows up as soon as you have media
		// added to your project. If two Graphweaver instances both have Media in them, the federation router will
		// expect that they're @shareable, but they won't return the same data from both places, so the best thing to do
		// is to namespace them so that they're unique entities. When this property is specified as true, the entity
		// will be renamed.
		//
		// For example, if our entity is called `Media` and our subgraph name is `music`, it'd be renamed to `MediaFromMusicSubgraph`.
		namespaceForFederation?: boolean;

		// In Federation v2, entities can specify resolvable: false in their @key directive. This is how you link to entities that are
		// outside of this Graphweaver instance. When this is set to false, we will emit @key(fields: "your pk field", resolvable: false).
		// You should do this for the providerless reference entities that are there for linking via federation that you don't actually
		// have the data for in this Graphweaver instance.
		//
		// Default: true
		resolvableViaFederation?: boolean;

		// This means that the entity will not be returned in federation queries to the _service { sdl } query.
		// In most cases it'd be better to use @inaccessible, but in some cases you truly do want a private entity
		// that is usable in your Graphweaver instance but is not part of the schema we tell the federation router about.
		excludeFromFederation?: boolean;
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

		// Specifies what field on this entity should be used to display a summary of the entity in the
		// detail panel in the Admin UI. This is useful for entities where the primary key field is not
		// the most useful field to display in the url.
		// This value defaults to the primary key field if not set.
		fieldForDetailPanelNavigationId?: Extract<keyof G, string>;

		// Specifies the type of control to use for this field in filter bar in the Admin UI.
		filterType?: AdminUIFilterType;
	};

	// These options are used internally by Graphweaver. No need to use them in your code.
	graphweaverInternalOptions?: {
		// This is used internally by reserved entities (such as GraphweaverMedia) to allow them to set their
		// names. You should never set this on your own entities, as it disables error checking that is there
		// to help ensure the system will work.
		ignoreReservedEntityNames?: boolean;
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

type VariableValues = {
	[name: string]: any;
};

export type CollectUnionTypeInformationArgs = Omit<UnionMetadata, 'type' | 'target'>;

export interface LogOnDidResolveOperationParams {
	ast: OperationDefinitionNode;
	variables: VariableValues | undefined;
}

export interface LogOnDidResolveOperationResponse {
	query: string;
	variables: VariableValues | undefined;
}

export interface AdditionalOperationInformation {
	name: string;
	getType: () => any;
	resolver: Resolver;
	directives?: Record<string, unknown>;
	args?: ArgsMetadata;
	description?: string;

	/**
	 * Optional function to override the default logging of the operation.
	 * This allows you to change the log message, perhaps to obfuscate sensitive data, or to add additional context.
	 * This log gets printed at `didResolveOperation` of the Apollo lifecycle.
	 * For more information of the lifecycle see https://www.apollographql.com/docs/apollo-server/integrations/plugins-event-reference#didresolveoperation
	 * @param params The query as AST and the variables as an object
	 * @returns the query and variables to log. Internally Graphweaver does something like `logger.info(logOnDidResolveOperation(params))`
	 */
	logOnDidResolveOperation?: (
		params: Readonly<LogOnDidResolveOperationParams>
	) => LogOnDidResolveOperationResponse;
}

export type MetadataType =
	| EntityMetadata<any, any>
	| EnumMetadata<any>
	| InputTypeMetadata<any, any>
	| DirectiveMetadata
	| UnionMetadata;

// Singleton protection. If there are multiple instances of Metadata from different Graphweaver versions
// all being installed side by side, we should error and let them know this.
const graphweaverMetadataVersion = Symbol('graphweaverMetadataVersion');
const globalWithMetadataVersion = global as GraphweaverMetadataVersion;
interface GraphweaverMetadataVersion {
	[graphweaverMetadataVersion]?: string;
}

if (globalWithMetadataVersion[graphweaverMetadataVersion] === undefined) {
	globalWithMetadataVersion[graphweaverMetadataVersion] = version;
} else if (globalWithMetadataVersion[graphweaverMetadataVersion] === version) {
	throw new Error(
		`Multiple instances of the Graphweaver Metadata singleton are being used, but the two that have been discovered are both version '${version}'. This is not supported. Please ensure you are not installing multiple versions of Graphweaver at once.`
	);
} else {
	throw new Error(
		`Multiple versions of the Graphweaver Metadata singleton are being used. The first version to load was '${globalWithMetadataVersion[graphweaverMetadataVersion]}' and the version trying to load currently is '${version}'. This is not supported. Please ensure you are not installing multiple versions of Graphweaver at once.`
	);
}

class Metadata {
	private metadataByType = new Map<unknown, MetadataType>();
	private nameLookupCache = new Map<string, MetadataType>();
	private typeByDataEntityLookup = new Map<unknown, unknown>();

	private additionalQueriesLookup = new Map<string, AdditionalOperationInformation>();
	private additionalMutationsLookup = new Map<string, AdditionalOperationInformation>();
	private entityDecoratorCallLog = new Set<unknown>();

	public federationSubgraphName?: string;

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
		// Clear the cache so we can rebuild it with the new data.
		this.nameLookupCache.clear();

		// Log this call so validation later knows that the entity was decorated as well as the fields
		// involved. This is used to give a more helpful error message when a GraphQL entity decorator
		// is accidentally placed on something like a database entity field.
		this.entityDecoratorCallLog.add(args.target);

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

		if (args.provider?.entityType) {
			this.typeByDataEntityLookup.set(args.provider.entityType, args.target);
		}
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
					`Entities can only declare one primary key field. An attempt was made to set ${args.name} as the primary key for ${entity.name} while ${String(existingMetadata.primaryKeyField)} is already set.`
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
					`Entities can only declare one summary field. An attempt was made to set ${args.name} as the summary field for ${entity.name} while ${String(existingMetadata.adminUIOptions?.summaryField)} is already set.`
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

	// get the metadata by provider.entityType (if it exists)
	public getEntityMetadataByDataEntity<G = unknown, D = unknown>(dataEntityClass: unknown): EntityMetadata<G, D> | undefined {
		if (typeof dataEntityClass !== 'function') return undefined;

		const entityClass = this.typeByDataEntityLookup.get(dataEntityClass);
		if (!entityClass) return undefined;

		const meta = this.metadataByType.get(entityClass);
		if (!isEntityMetadata(meta)) return undefined;

		return meta;
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

	public getAdditionalQueryByName(name: string) {
		return this.additionalQueriesLookup.get(name);
	}

	public getAdditionalMutationByName(name: string) {
		return this.additionalMutationsLookup.get(name);
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
		if (allOperations.has(keyParts[keyParts.length - 1])) {
			// Ok, that'll be the field name.
			return entity.fields[key];
		}

		return undefined;
	}

	public addQuery(
		args: AdditionalOperationInformation & {
			intentionalOverride?: boolean;
		}
	) {
		if (this.additionalQueriesLookup.has(args.name) && !args.intentionalOverride) {
			throw new Error(
				`Query with name ${args.name} already exists and this is not an intentional override`
			);
		}

		this.additionalQueriesLookup.set(args.name, args);
	}

	public addMutation(
		args: AdditionalOperationInformation & {
			intentionalOverride?: boolean;
		}
	) {
		if (this.additionalMutationsLookup.has(args.name) && !args.intentionalOverride) {
			throw new Error(
				`Mutation with name ${args.name} already exists and this is not an intentional override`
			);
		}

		// We'll copy it here just to be sure it doesn't get mutated later without our knowledge.
		this.additionalMutationsLookup.set(args.name, { ...args });
	}

	public federationNameForEntity(entity: EntityMetadata<any, any>) {
		if (entity.apiOptions?.namespaceForFederation) {
			return this.federationNameForGraphQLTypeName(entity.name);
		}

		return entity.name;
	}

	public federationNameForGraphQLTypeName(name: string) {
		if (this.federationSubgraphName) {
			return `${name}From${this.federationSubgraphName.charAt(0).toUpperCase() + this.federationSubgraphName.slice(1)}Subgraph`;
		}

		return name;
	}

	public clear() {
		this.federationSubgraphName = undefined;
		this.metadataByType.clear();
		this.nameLookupCache.clear();
		this.typeByDataEntityLookup.clear();
		this.additionalMutationsLookup.clear();
		this.additionalQueriesLookup.clear();
	}

	// This exists because it's exceedingly easy to put the wrong decorator on the wrong entity, e.g.
	// accidentally decorating your DB entity fields with GraphQL entity decorators. When this happens,
	// without this validation the error message is not very helpful because it just says there's a duplicate
	// entity with the same name. We can actually catch this specific scenario and give a much more helpful
	// error, so that's what this function does.
	public readonly validateEntities = () => {
		for (const entity of this.entities()) {
			if (!this.entityDecoratorCallLog.has(entity.target)) {
				throw new Error(
					`The entity '${entity.name}' is missing the @Entity() decorator from Graphweaver. This is likely because a field was mistakenly decorated with a GraphQL decorator when it is not a GraphQL entity. Fields on this entity are: '${Object.keys(
						entity.fields
					).join(
						`', '`
					)}'. If this is not a full list of all of the fields on the entity, examine the decorators on these fields closely and make sure they are in the correct files. Are they on a data source entity instead of the GraphQL entity?`
				);
			}
		}
	};
}

export const graphweaverMetadata = new Metadata();

graphweaverMetadata.collectEnumInformation({
	name: 'Sort',
	target: Sort,
});
