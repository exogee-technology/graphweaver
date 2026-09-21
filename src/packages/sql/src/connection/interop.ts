/**
 * Reads a named export from a dynamically imported module.
 *
 * The database drivers are all CommonJS. Importing one with `await import()` from an ES module can
 * put its exports one `default` deep, depending on the loader, so destructuring straight off the
 * namespace gets `undefined` and fails later with something unhelpful like "X is not a
 * constructor". Checking both places is unglamorous but it is the difference between the package
 * working under every loader and working under some of them.
 */
export const moduleExport = <T>(namespace: unknown, name: string): T => {
	const candidate = namespace as Record<string, unknown> | undefined;
	const value = candidate?.[name] ?? (candidate?.default as Record<string, unknown>)?.[name];

	if (value === undefined) {
		throw new Error(`Could not read '${name}' from the imported driver module.`);
	}

	return value as T;
};
