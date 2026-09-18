/**
 * Asks whether a relationship has any rows at all: `{ tracks_exists: false }`.
 *
 * Kept out of `OPERATORS` because it applies to relationships rather than columns, and takes a
 * boolean rather than a value of the field's own type.
 */
export const EXISTS_SUFFIX = '_exists';

/** The complete operator set, matching core's `operations.ts`. */
export const OPERATORS = [
	'ne',
	'notnull',
	'null',
	'in',
	'nin',
	'like',
	'ilike',
	'gt',
	'gte',
	'lt',
	'lte',
] as const;

export type Operator = (typeof OPERATORS)[number];

// Longest first, so a longer operator is never shadowed by a shorter one that also matches.
const BY_LENGTH_DESC = [...OPERATORS].sort((a, b) => b.length - a.length);

export interface SplitKey {
	field: string;
	operator?: Operator;
}

/**
 * Splits `unitPrice_gte` into `{ field: 'unitPrice', operator: 'gte' }`.
 *
 * The MikroORM provider does this with `key.split('_')` and takes elements 0 and 1, which mangles
 * any field whose name contains an underscore: `first_name_gte` becomes field `first`, operator
 * `name`. We resolve against the real field list instead, so an exact field name always wins and a
 * suffix is only treated as an operator when the remaining prefix is genuinely a field.
 */
export const splitFilterKey = (
	key: string,
	isKnownField: (name: string) => boolean
): SplitKey | undefined => {
	if (isKnownField(key)) return { field: key };

	for (const operator of BY_LENGTH_DESC) {
		const suffix = `_${operator}`;
		if (!key.endsWith(suffix)) continue;

		const field = key.slice(0, -suffix.length);
		if (isKnownField(field)) return { field, operator };
	}

	return undefined;
};
