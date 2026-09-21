import type { ColumnMeta, ColumnType, Expr, Predicate, SelectNode } from './nodes';

export const TRUE: Predicate = { kind: 'true' };
export const FALSE: Predicate = { kind: 'false' };

export const param = (value: unknown, type: ColumnType, meta?: ColumnMeta): Expr => ({
	kind: 'param',
	value,
	type,
	meta,
});

export const lower = (operand: Expr): Expr => ({ kind: 'lower', operand });

/**
 * Flattens and simplifies as it builds, so the compiler never has to think about a one-element AND
 * or an empty OR, and so the golden SQL stays readable.
 *
 * Note the identities: an empty AND is TRUE and an empty OR is FALSE. `_or: []` meaning "match
 * nothing" is the access-control-safe reading, and `findOne` bypasses core's `cleanFilter`, so
 * these cases genuinely reach us.
 */
export const and = (operands: Predicate[]): Predicate => {
	const flat: Predicate[] = [];

	for (const operand of operands) {
		if (operand.kind === 'true') continue;
		if (operand.kind === 'false') return FALSE;
		if (operand.kind === 'and') flat.push(...operand.operands);
		else flat.push(operand);
	}

	if (flat.length === 0) return TRUE;
	if (flat.length === 1) return flat[0];
	return { kind: 'and', operands: flat };
};

export const or = (operands: Predicate[]): Predicate => {
	const flat: Predicate[] = [];

	for (const operand of operands) {
		if (operand.kind === 'false') continue;
		if (operand.kind === 'true') return TRUE;
		if (operand.kind === 'or') flat.push(...operand.operands);
		else flat.push(operand);
	}

	if (flat.length === 0) return FALSE;
	if (flat.length === 1) return flat[0];
	return { kind: 'or', operands: flat };
};

export const not = (operand: Predicate): Predicate => {
	if (operand.kind === 'true') return FALSE;
	if (operand.kind === 'false') return TRUE;
	if (operand.kind === 'not') return operand.operand;
	// Pushing negation into EXISTS is what turns `_not: { tracks: { name: 'x' } }` into
	// NOT EXISTS (...) -- "has no track called x" -- rather than something about some track.
	if (operand.kind === 'exists') return { ...operand, negated: !operand.negated };
	return { kind: 'not', operand };
};

export const exists = (select: SelectNode): Predicate => ({
	kind: 'exists',
	select,
	negated: false,
});

/** Aliases are generated integers, never anything derived from entity or field names. */
export class AliasAllocator {
	private readonly counters = new Map<string, number>();

	next(prefix: string): string {
		const next = (this.counters.get(prefix) ?? 0) + 1;
		this.counters.set(prefix, next);
		return `${prefix}${next}`;
	}
}
