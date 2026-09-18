import {
	getFieldTypeWithMetadata,
	graphweaverMetadata,
	isEntityMetadata,
} from '@exogee/graphweaver';
import type { EntityMetadata, FieldMetadata } from '@exogee/graphweaver';
import { SQL_STORAGE } from '../decorators/types';
import type { SqlFieldOptions } from '../decorators';
import type { HiddenColumnDefinition, SqlFieldStorage } from '../decorators/types';
import { columnTypeForField, itemTypeForField } from './column-type';
import type { ColumnMeta, ColumnType } from '../ir/nodes';
import type { NamingStrategy } from './naming';
import { pluralTableName, snakeCase } from './naming';
import type { PivotRef, ResolvedColumn, ResolvedEntity, ResolvedRelationship } from './types';

export interface ColumnOverride {
	column?: string;
	type?: ColumnType;
	meta?: ColumnMeta;
	nullable?: boolean;
	generated?: 'identity' | 'always' | 'default' | false;
}

export interface ResolveOptions {
	/** Overrides the table name the naming strategy would derive. */
	table?: string;
	schema?: string;
	namingStrategy?: NamingStrategy;
	pluraliseTableNames?: boolean;
	/**
	 * Per-property overrides, for entities you cannot decorate -- a package's own entity, say.
	 * A bare string sets just the column name.
	 */
	columns?: Record<string, string | ColumnOverride>;
	/** Columns in the database that are not in the GraphQL schema. */
	hidden?: Record<string, HiddenColumnDefinition>;
}

const storageFor = (field: FieldMetadata<any, any>): SqlFieldStorage | undefined =>
	field.additionalInformation?.[SQL_STORAGE] as SqlFieldStorage | undefined;

/** A relationship is a field whose type resolves to another entity. */
const relatedEntityFor = (field: FieldMetadata<any, any>) => {
	const { isList, metadata } = getFieldTypeWithMetadata(field.getType);
	return isEntityMetadata(metadata) ? { entity: metadata, isList } : undefined;
};

/** Class methods are field resolvers, never columns. */
const isMethod = (entity: EntityMetadata<any, any>, field: FieldMetadata<any, any>) =>
	typeof (entity.target?.prototype as any)?.[field.name] === 'function';

const nullableFor = (field: FieldMetadata<any, any>) =>
	field.nullable === true || field.nullable === 'items' || field.nullable === 'itemsAndList';

/**
 * Turns a Graphweaver entity into the mapping the query planner reads.
 *
 * Resolution is lazy and memoised by the provider, because related entity classes may not have
 * been evaluated yet when a provider is constructed inside an `@Entity` decorator argument.
 */
export const resolveEntity = (
	entity: EntityMetadata<any, any>,
	options: ResolveOptions = {},
	resolveRelated: (entity: EntityMetadata<any, any>) => ResolvedEntity
): ResolvedEntity => {
	const naming = options.namingStrategy ?? snakeCase;
	const table =
		options.table ??
		(options.pluraliseTableNames
			? pluralTableName(naming, entity.name)
			: naming.tableName(entity.name));

	const overrideFor = (property: string): ColumnOverride => {
		const override = options.columns?.[property];
		return typeof override === 'string' ? { column: override } : (override ?? {});
	};

	const columnName = (property: string) =>
		overrideFor(property).column ?? naming.columnName(property);

	const columns = new Map<string, ResolvedColumn>();
	const relationships = new Map<string, ResolvedRelationship>();
	const primaryKeyProperty = graphweaverMetadata.primaryKeyFieldForEntity(entity);

	for (const field of Object.values(entity.fields)) {
		const storage = storageFor(field);
		if (storage?.kind === 'unmapped') continue;
		if (isMethod(entity, field)) continue;

		const related = relatedEntityFor(field);

		if (!related) {
			const override = overrideFor(field.name);

			// `collectFieldInformation` keeps whatever options it was handed, so the extras this
			// package's `@Field` accepts arrive here as ordinary properties -- no wrapper decorator
			// and no `additionalInformation` to unpack. Core has no reason to know their names,
			// hence the cast.
			const sql = field as typeof field & SqlFieldOptions;
			const type = sql.columnType || override.type || columnTypeForField(field);

			columns.set(field.name, {
				property: field.name,
				name: sql.column || columnName(field.name),
				type,
				meta:
					sql.columnMeta ??
					override.meta ??
					// An array column with nothing said about it still needs an element type.
					(type === 'array' ? { items: itemTypeForField(field) } : undefined),
				nullable: override.nullable ?? nullableFor(field),
				generated:
					override.generated !== undefined
						? override.generated
						: sql.generated !== undefined
							? sql.generated
							: // A primary key is database generated unless the entity says the client
								// supplies it, in which case it has to be written like any other column.
								field.name === primaryKeyProperty && !entity.apiOptions?.clientGeneratedPrimaryKeys
								? 'identity'
								: false,
			});
			continue;
		}

		const target = () => resolveRelated(related.entity);

		// Many to many, either side.
		if (storage?.kind === 'manyToMany') {
			const pivot = pivotFor(entity, field, storage.through, storage.relatedField, naming, target);
			relationships.set(field.name, { kind: 'manyToMany', property: field.name, target, pivot });
			continue;
		}

		// One to many: the inverse side of somebody else's foreign key.
		if (storage?.kind === 'oneToMany' || (!storage && related.isList)) {
			const relatedField =
				storage?.kind === 'oneToMany' ? storage.relatedField : field.relationshipInfo?.relatedField;

			if (!relatedField) {
				throw new Error(
					`'${entity.name}.${field.name}' is a to-many relationship but does not say which ` +
						`field on ${related.entity.name} points back at it. Give it a relatedField.`
				);
			}

			relationships.set(field.name, {
				kind: 'oneToMany',
				property: field.name,
				target,
				targetForeignKey: () => {
					const other = target();
					const inverse = other.relationships.get(relatedField);

					if (!inverse || inverse.kind !== 'manyToOne') {
						throw new Error(
							`'${entity.name}.${field.name}' names relatedField '${relatedField}' on ` +
								`${related.entity.name}, but that is not a many-to-one back to ${entity.name}.`
						);
					}

					return inverse.foreignKey;
				},
			});
			continue;
		}

		// Many to one: the foreign key is ours.
		const foreignKeyName =
			(storage?.kind === 'manyToOne' && storage.column) ||
			overrideFor(field.name).column ||
			naming.foreignKeyColumn(field.name);

		relationships.set(field.name, {
			kind: 'manyToOne',
			property: field.name,
			target,
			foreignKey: {
				property: field.name,
				name: foreignKeyName,
				// A foreign key carries the *related* primary key's type, and that entity may not
				// have been resolved yet, so read it through the thunk on access.
				get type() {
					return target().primaryKey.type;
				},
				nullable: nullableFor(field),
			},
		});
	}

	for (const [property, definition] of Object.entries(options.hidden ?? {})) {
		columns.set(property, {
			property,
			name: definition.column ?? columnName(property),
			type: definition.type,
			meta: definition.meta,
			nullable: definition.nullable ?? false,
			generated: definition.generated ?? false,
			select: definition.select ?? true,
			hidden: true,
		});
	}

	const primaryKey = columns.get(primaryKeyProperty);
	if (!primaryKey) {
		throw new Error(
			`Entity '${entity.name}' has no column for its primary key field ` +
				`'${primaryKeyProperty}'. The SQL provider needs a single column primary key.`
		);
	}

	return {
		name: entity.name,
		schema: options.schema,
		table,
		primaryKey,
		columns,
		relationships,
	};
};

const pivotFor = (
	entity: EntityMetadata<any, any>,
	field: FieldMetadata<any, any>,
	through: PivotRef | undefined,
	relatedField: string | undefined,
	naming: NamingStrategy,
	target: () => ResolvedEntity
): PivotRef => {
	if (through) return through;

	if (!relatedField) {
		throw new Error(
			`'${entity.name}.${field.name}' is a many-to-many but declares neither 'through' (the ` +
				`owning side, which defines the pivot) nor 'relatedField' (the inverse side).`
		);
	}

	// The inverse side mirrors whatever the owning side declared, with the columns swapped.
	const owner = target().relationships.get(relatedField);

	if (!owner || owner.kind !== 'manyToMany') {
		throw new Error(
			`'${entity.name}.${field.name}' names relatedField '${relatedField}', but that is not a ` +
				`many-to-many on the other side.`
		);
	}

	void naming;

	return {
		schema: owner.pivot.schema,
		table: owner.pivot.table,
		joinColumn: owner.pivot.inverseJoinColumn,
		inverseJoinColumn: owner.pivot.joinColumn,
	};
};
