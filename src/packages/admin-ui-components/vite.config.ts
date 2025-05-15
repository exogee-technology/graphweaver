// vite.config.ts
import { defineConfig } from 'vitest/config';
import graphweaverPlugin from '../vite-plugin-graphweaver/src/index';

export default defineConfig({
	test: {
		globals: true, // auto imports describe etc.
		include: ['./src/**/*.test.ts'],
	},
	plugins: [graphweaverPlugin()],
});
