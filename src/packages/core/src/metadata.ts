import { logger } from '@exogee/logger';
import { DirectiveLocation, OperationDefinitionNode } from 'graphql';
const version = '0.0.0';

import { FieldOptions } from './decorators';
import { HookRegister } from './hook-manager';
import { allOperations } from './operations.js';
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
} from './types.js';

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