import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			// The round trip writes generated code verbatim, and that code imports this package by
			// its published name. An alias resolves it; a self-dependency in package.json would
			// too, but turbo refuses a package that depends on itself and the whole workspace
			// build stops.
			'@exogee/graphweaver-sql-sqlite': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
		},
	},
	test: {
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
	},
});
