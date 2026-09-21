import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		include: ['src/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
		// Every file in this package points at the same database and drops and recreates the same
		// tables, so running them in parallel means one file introspects a schema another is
		// halfway through rebuilding. That produced a genuinely baffling intermittent failure
		// before it was tracked down, so it is worth being explicit rather than clever here.
		fileParallelism: false,
	},
});
