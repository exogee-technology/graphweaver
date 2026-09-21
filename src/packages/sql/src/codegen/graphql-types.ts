import type { ColumnType } from '../ir/nodes';
import type { PropertyModel } from '../introspection/entity-model';

export interface GraphQLTypeRef {
	/** What goes inside `@Field(() => ...)`. */
	expression: string;
	/** The TypeScript type of the property. */
	tsType: string;
	/** Module -> named imports this type needs. */
	imports?: { module: string; name: string }[];
}

const CORE = '@exogee/graphweaver';

/**
 * Everything scalar comes from here, including the types that originate in `graphql-scalars`: that
 * package re-exports them, and it is the one a generated project actually has installed. Importing
 * `graphql-scalars` directly produces a file that will not build.
 */
const SCALARS = '@exogee/graphweaver-scalars';

/**
 * Picks the GraphQL type for a column.
 *
 * `bigint` becomes a string rather than a JS `bigint`, because `JSON.stringify` throws on the
 * latter, and `decimal` becomes a string rather than a number, because a double cannot hold what a
 * numeric column can. Both match what the existing generator emits, so migrating projects see no
 * change in their API.
 */
export const graphQLTypeFor = (property: PropertyModel): GraphQLTypeRef => {
	if (property.isPrimaryKey) {
		return {
			expression: 'ID',
			tsType: property.type === 'int' ? 'number' : 'string',
			imports: [{ module: CORE, name: 'ID' }],
		};
	}

	const byType: Record<ColumnType, GraphQLTypeRef> = {
		boolean: { expression: 'Boolean', tsType: 'boolean' },
		int: { expression: 'Number', tsType: 'number' },
		float: { expression: 'Number', tsType: 'number' },
		bigint: {
			expression: 'GraphQLBigInt',
			tsType: 'string',
			imports: [{ module: SCALARS, name: 'GraphQLBigInt' }],
		},
		decimal: { expression: 'String', tsType: 'string' },
		string: { expression: 'String', tsType: 'string' },
		text: { expression: 'String', tsType: 'string' },
		uuid: { expression: 'String', tsType: 'string' },
		json: {
			expression: 'GraphQLJSON',
			tsType: 'Record<string, unknown>',
			imports: [{ module: SCALARS, name: 'GraphQLJSON' }],
		},
		date: {
			expression: 'DateScalar',
			tsType: 'Date',
			imports: [{ module: SCALARS, name: 'DateScalar' }],
		},
		time: { expression: 'String', tsType: 'string' },
		datetime: { expression: 'Date', tsType: 'Date' },
		binary: {
			expression: 'GraphQLByte',
			tsType: 'Buffer',
			imports: [{ module: SCALARS, name: 'GraphQLByte' }],
		},
		// An array's element type is what decides the GraphQL type, and codegen fills that in from
		// the column meta before calling this.
		array: { expression: '[String]', tsType: 'string[]' },
		unknown: { expression: 'String', tsType: 'string' },
	};

	return byType[property.type];
};
