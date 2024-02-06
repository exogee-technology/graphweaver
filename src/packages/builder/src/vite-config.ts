import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
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
}: ViteConfigOptions): InlineConfig => {
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
			include: ['react-dom/client', 'react-dom', 'hoist-non-react-statics', 'react-fast-compare'],
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
