import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import graphweaver from 'vite-plugin-graphweaver';
import { InlineConfig } from 'vite';
import path from 'path';
import { requireSilent } from './util';

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
}: ViteConfigOptions): InlineConfig => {
	// This is a fix to the issue where the bundled components are not being optimized for esm.
	// Issue: https://github.com/exogee-technology/graphweaver/issues/290
	const optimizeDeps = [
		...Object.keys(
			requireSilent('@exogee/graphweaver-admin-ui-components/package.json').dependencies
		),
		...Object.keys(
			requireSilent('@exogee/graphweaver-auth-ui-components/package.json').dependencies
		),
		...Object.keys(requireSilent('@exogee/graphweaver-admin-ui/package.json').dependencies),
	];

	return {
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
			include: ['react-dom/client', ...optimizeDeps],
			exclude: [
				// This can't be bundled because it's virtual and supplied by
				// our vite plugin directly.
				'virtual:graphweaver-user-supplied-custom-pages',
				'virtual:graphweaver-user-supplied-custom-fields',
			],
		},
		plugins: [svgr(), react(), graphweaver()],
	};
};
