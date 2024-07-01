import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
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
		include: ['react-dom/client'],
		exclude: [
			// This can't be bundled because it's virtual and supplied by
			// our vite plugin directly.
			'virtual:graphweaver-user-supplied-custom-pages',
			'virtual:graphweaver-user-supplied-custom-fields',
		],
	},
	plugins: [commonjs(), react(), graphweaver()],
});
