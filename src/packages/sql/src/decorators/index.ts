import { graphweaverMetadata } from '@exogee/graphweaver';
import type { FieldOptions, GetTypeFunction } from '@exogee/graphweaver';
import { SQL_STORAGE } from './types';
import type { PivotSpec, SqlFieldStorage } from './types';
import type { ColumnMeta, ColumnType } from '../ir/nodes';

export * from './types';

/**
 * The storage descriptor goes in `FieldMetadata.additionalInformation`, which core already
 * documents as the place for a plugin to keep its own namespaced data -- the `@MediaField`
 * decorator in the storage provider package does the same thing. So none of this needs core to
 * know that SQL exists.
 */
const collect = (
	target: unknown,
	key: string,
	getType: GetTypeFunction,
	storage: SqlFieldStorage,
	options: Record<string, unknown> = {}
) => {
	const { additionalInformation, ...rest } = options as {
		additionalInformation?: Record<string, unknown>;
	};

	graphweaverMetadata.collectFieldInformation({
		...rest,
		name: key,
		getType,
		target: target as new (...args: any[]) => unknown,
		additionalInformation: { ...additionalInformation, [SQL_STORAGE]: storage },
	} as Parameters<typeof graphweaverMetadata.collectFieldInformation>[0]);
};

/**
 * `@Field`, plus the handful of things a column needs that a GraphQL field does not.
 *
 * Import this instead of core's `@Field` on an entity served by a `SqlDataProvider`:
 *
 *     import { Entity, ID } from '@exogee/graphweaver';
 *     import { Field, SqlDataProvider } from '@exogee/graphweaver-sql';
 *
 *     @Entity<Album>('Album', { provider: new SqlDataProvider(() => Album, connection) })
 *     export class Album {
 *       @Field(() => ID, { primaryKeyField: true })
 *       albumId!: number;
 *
 *       @Field(() => String, { column: 'Title' })
 *       title!: string;
 *     }
 *
 * It is a superset of core's, so one import covers every field on the entity whether or not it
 * needs anything from here -- and core's `@Field` still works, it just will not offer these.
 *
 * Per package rather than a global type augmentation, so a REST entity in the same project is not
 * offered options its provider would ignore. Per *entity* is not reachable: `@Field` is evaluated
 * before the `@Entity` decorator that names the provider, so at that moment neither the type system
 * nor the runtime knows which provider this entity will end up on.
 */
export interface SqlFieldOptions extends FieldOptions {
	/** Overrides the column name the naming strategy would derive. */
	column?: string;
	/**
	 * Overrides the column type inferred from the GraphQL type.
	 *
	 * Spelled `columnType` rather than `type` because it sits beside `() => [String]`, which is
	 * also a type and a different one.
	 */
	columnType?: ColumnType;
	/**
	 * How an `array` column is stored, a decimal's precision, and so on.
	 *
	 *     @Field(() => [String], {
	 *       columnType: 'array',
	 *       columnMeta: { items: 'string', arrayEncoding: 'delimited' },
	 *     })
	 */
	columnMeta?: ColumnMeta;
	/** How the database produces the value, which decides whether we write the column at all. */
	generated?: 'identity' | 'always' | 'default' | false;
}

export function Field(getType: GetTypeFunction, options: SqlFieldOptions = {}) {
	return (target: unknown, key: string) => {
		graphweaverMetadata.collectFieldInformation({
			...options,
			name: key,
			getType,
			target: target as new (...args: any[]) => unknown,
		} as Parameters<typeof graphweaverMetadata.collectFieldInformation>[0]);
	};
}

export interface ManyToOneOptions {
	/** The foreign key column on this table. */
	column?: string;
	nullable?: boolean;
	[key: string]: unknown;
}

/**
 * The owning side of a many-to-one. The foreign key lives on this table.
 *
 * `relationshipInfo.id` is supplied for you, reading the key from a symbol keyed side channel on
 * the row rather than from `row[property]`. That matters: core treats a defined `source[field]` as
 * "already resolved" and returns it verbatim, so parking a stub there would starve every other
 * field on the related entity and skip the access control filters that run with the loader.
 */
export function ManyToOne(getType: GetTypeFunction, options: ManyToOneOptions = {}) {
	return (target: unknown, key: string) => {
		const { column, nullable = false, ...rest } = options;

		graphweaverMetadata.collectFieldInformation({
			...rest,
			name: key,
			getType,
			nullable,
			target: target as new (...args: any[]) => unknown,
			relationshipInfo: { id: (row: any) => row?.[FOREIGN_KEYS]?.[key] },
			additionalInformation: {
				...(rest.additionalInformation as Record<string, unknown>),
				[SQL_STORAGE]: { kind: 'manyToOne', column },
			},
		} as Parameters<typeof graphweaverMetadata.collectFieldInformation>[0]);
	};
}

/** Where a row carries its foreign keys, out of sight of the GraphQL layer. */
export const FOREIGN_KEYS = Symbol.for('graphweaver.sql.foreignKeys');

export interface OneToManyOptions {
	/** The field on the related entity that points back here. */
	relatedField: string;
	[key: string]: unknown;
}

/** The inverse side. The foreign key is on the other table, found via `relatedField`. */
export function OneToMany(getType: GetTypeFunction, options: OneToManyOptions) {
	return (target: unknown, key: string) => {
		const { relatedField, ...rest } = options;

		graphweaverMetadata.collectFieldInformation({
			...rest,
			name: key,
			getType,
			target: target as new (...args: any[]) => unknown,
			relationshipInfo: { relatedField },
			additionalInformation: {
				...(rest.additionalInformation as Record<string, unknown>),
				[SQL_STORAGE]: { kind: 'oneToMany', relatedField },
			},
		} as Parameters<typeof graphweaverMetadata.collectFieldInformation>[0]);
	};
}

export interface ManyToManyOptions extends Record<string, unknown> {
	/**
	 * The field on the *related* entity that points back here.
	 *
	 * Required on both sides, because core's dataloader resolves the relationship by calling
	 * `findByRelatedId` with this name against the related entity -- so it has to be a field that
	 * genuinely exists over there. Defaulting it to this field's own name looks harmless and then
	 * fails at query time on the owning side.
	 */
	relatedField: string;
	/** Only the owning side declares the pivot; the inverse side mirrors it. */
	through?: PivotSpec;
}

export function ManyToMany(getType: GetTypeFunction, options: ManyToManyOptions) {
	return (target: unknown, key: string) => {
		const { through, relatedField, ...rest } = options;

		graphweaverMetadata.collectFieldInformation({
			...rest,
			name: key,
			getType,
			target: target as new (...args: any[]) => unknown,
			relationshipInfo: { relatedField },
			additionalInformation: {
				...(rest.additionalInformation as Record<string, unknown>),
				[SQL_STORAGE]: { kind: 'manyToMany', through, relatedField },
			},
		} as Parameters<typeof graphweaverMetadata.collectFieldInformation>[0]);
	};
}

/** In the API, but not backed by a column. Computed fields and the like. */
export function Unmapped(getType: GetTypeFunction, options: Record<string, unknown> = {}) {
	return (target: unknown, key: string) => {
		collect(target, key, getType, { kind: 'unmapped' }, options);
	};
}
