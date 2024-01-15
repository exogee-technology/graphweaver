// vite.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true, // auto imports describe etc.
		include: ['./src/**/*.test.ts'],
	},
});
