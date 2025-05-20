// vite.config.ts
import { defineConfig } from 'vitest/config';
import graphweaverPluginImport from 'vite-plugin-graphweaver';

const graphweaverPlugin = (graphweaverPluginImport as any)
	.default as typeof graphweaverPluginImport;

export default defineConfig({
	test: {
		globals: true, // auto imports describe etc.
		include: ['./src/**/*.test.ts'],
	},
	plugins: [graphweaverPlugin()],
});
