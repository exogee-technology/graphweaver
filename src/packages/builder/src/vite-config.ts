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

	// if config includes auth options then check that the auth package is installed
	const config = getGraphweaverConfig();

	// Auth is optional, so we only need to check if it's enabled.
	// If it is, we need to make sure the package is installed.
	if (config.adminUI.auth?.primaryMethods) {
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { dependencies } = require(path.join(process.cwd(), './package.json'));
		const packages = Object.keys(dependencies);
		if (!packages.includes('@exogee/graphweaver-auth-ui-components')) {
			throw new Error(
				`You have auth enabled in your Graphweaver config, but the auth package is not installed. Run 'pnpm add @exogee/graphweaver-auth-ui-components' to install it.`
			);
		}
	}

	return {
		configFile: false,
		root: rootDirectory,
		base,
		define: {
			...(backendUrl ? { 'import.meta.env.VITE_GRAPHWEAVER_API_URL': `'${backendUrl}'` } : {}),
			'import.meta.env.VITE_ADMIN_UI_BASE': `'${base.replace(/\/$/, '')}'`,
			'import.meta.env.VITE_GRAPHWEAVER_CONFIG': JSON.stringify(config.adminUI),
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
				'graphiql',
				'graphql',
				'graphql-tag',
				'@exogee/graphweaver-admin-ui-components > react-syntax-highlighter',
				'@exogee/graphweaver-admin-ui-components > react-syntax-highlighter/dist/esm/styles/prism/coldark-dark',
				'@exogee/graphweaver-admin-ui-components > react-syntax-highlighter/dist/esm/languages/prism/graphql',
				'@exogee/graphweaver-admin-ui-components > react-syntax-highlighter/dist/esm/languages/prism/typescript',
				'@exogee/graphweaver-admin-ui-components > react-syntax-highlighter/dist/esm/languages/prism/json',

				// These are CJS dependencies that need to get translated to ESM before Vite will be happy with them.
				// We used to pull all of our dependencies in automatically from package.json and force this, but
				// optimizing deps also means they're not normal source files, so we want this to be a minimal list
				// that decreases over time.
				'@babel/runtime/regenerator',
				'copy-to-clipboard',
				'graphql-deduplicator',
				'hoist-non-react-statics',
				'nullthrows',
				'papaparse',
				'prop-types',
				'react',
				'react-dom',
				'react-dom/client',
				'react-fast-compare',
				'react-is',
				'react-router-dom',
				'rehackt',
				'set-value',
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
