import graphweaver from 'vite-plugin-graphweaver';
import { config as getGraphweaverConfig } from '@exogee/graphweaver-config';

import type { InlineConfig } from 'vite';
import path from 'path';

export interface ViteConfigOptions {
	rootDirectory: string;
	backendUrl?: string;
	host?: string;
	port?: number;
	base?: string;
}

export const viteConfig = async ({
	host,
	port,
	rootDirectory,
	backendUrl,
	base = '/',
}: ViteConfigOptions): Promise<InlineConfig> => {
	// This needs to be ESM imported regardless of whether we're in CJS or ESM because the
	// CJS entrypoint for vite has been deprecated.
	const { default: react } = await import('@vitejs/plugin-react');

	return {
		configFile: false,
		root: rootDirectory,
		base,
		define: {
			...(backendUrl ? { 'import.meta.env.VITE_GRAPHWEAVER_API_URL': `'${backendUrl}'` } : {}),
			'import.meta.env.VITE_ADMIN_UI_BASE': `'${base.replace(/\/$/, '')}'`,
			'import.meta.env.VITE_GRAPHWEAVER_CONFIG': JSON.stringify(getGraphweaverConfig().adminUI),
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
				// These are deps where if we don't pre-build them things stop working even though they're ESM.
				// Not sure why, but they need to be here.
				'formik',
				'graphql',

				// These are CJS dependencies that need to get translated to ESM before Vite will be happy with them.
				// We used to pull all of our dependencies in automatically from package.json and force this, but
				// optimizing deps also means they're not normal source files, so we want this to be a minimal list
				// that decreases over time.
				'copy-to-clipboard',
				'graphql-deduplicator',
				'hoist-non-react-statics',
				'nullthrows',
				'papaparse',
				'prop-types',
				'react-dom',
				'react-dom/client',
				'react-fast-compare',
				'react-is',
				'react-router-dom',
				'react',
				'rehackt',
				'set-value',
				'react-code-blocks',
			],
			exclude: [
				// This can't be bundled because it's virtual and supplied by
				// our vite plugin directly.
				'virtual:graphweaver-user-supplied-custom-pages',
				'virtual:graphweaver-user-supplied-custom-fields',
				'virtual:graphweaver-auth-ui-components',
			],
		},
		plugins: [react(), graphweaver()],
	};
};
