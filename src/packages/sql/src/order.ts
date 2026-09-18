/**
 * Orders strings by code unit, deterministically.
 *
 * `sort()` with no comparator already does this, and linters flag it because for anything a person
 * reads the order should be locale aware. None of these sorts are for reading: they order generated
 * import lists, pivot table names, and the field lists in error messages, where what matters is
 * that the same input produces the same output on every machine that runs the importer.
 *
 * `localeCompare` would make that depend on the runtime's locale, so it is the wrong fix here --
 * the same schema could generate a different pivot table name on a different machine.
 */
export const byCodeUnit = (left: string, right: string) =>
	left < right ? -1 : left > right ? 1 : 0;
