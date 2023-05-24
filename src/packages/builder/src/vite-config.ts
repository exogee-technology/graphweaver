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
			'import.meta.env.VITE_ADMIN_UI_BASE': `'${base}'`
		},
		build: {
			outDir: path.resolve(process.cwd(), '.graphweaver', 'admin-ui'),
		},
		server: {
			...(host ? { host } : {}),
			...(port ? { port } : {}),
		},
		optimizeDeps: {
			include: ['react-dom/client', 'react-dom'],
		},
		plugins: [svgr(), react(), graphweaver()],
	};
};
