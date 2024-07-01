import react from '@vitejs/plugin-react';
import graphweaver from 'vite-plugin-graphweaver';
import { InlineConfig } from 'vite';
import path from 'path';

export interface ViteConfigOptions {
	rootDirectory: string;
	backendUrl?: string;
	host?: string;
	port?: number;
	base?: string;
}

export const viteConfig = ({
	host,
	port,
	rootDirectory,
	backendUrl,
	base = '/',
}: ViteConfigOptions): InlineConfig => ({
	configFile: false,
	root: rootDirectory,
	base,
	define: {
		...(backendUrl ? { 'import.meta.env.VITE_GRAPHWEAVER_API_URL': `'${backendUrl}'` } : {}),
		'import.meta.env.VITE_ADMIN_UI_BASE': `'${base.replace(/\/$/, '')}'`,
	},
	build: {
		outDir: path.resolve(process.cwd(), '.graphweaver', 'admin-ui'),
	},
	server: {
		...(host ? { host } : {}),
		...(port ? { port } : {}),
	},
	optimizeDeps: {
		include: [
			'react-dom',
			'react-dom/client',

			// These are CJS dependencies that need to get translated to ESM before Vite will be happy with them.
			// We used to pull all of our dependencies in automatically from package.json and force this, but
			// optimizing deps also means they're not normal source files, so we want this to be a minimal list.
			'copy-to-clipboard',
			'graphql-deduplicator',
			'hoist-non-react-statics',
			'nullthrows',
			'papaparse',
			'prop-types',
			'react-fast-compare',
			'react-is',
			'rehackt',
			'set-value',
		],
		exclude: [
			// This can't be bundled because it's virtual and supplied by
			// our vite plugin directly.
			'virtual:graphweaver-user-supplied-custom-pages',
			'virtual:graphweaver-user-supplied-custom-fields',
		],
	},
	plugins: [react(), graphweaver()],
});
