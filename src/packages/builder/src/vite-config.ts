import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import graphweaver from 'vite-plugin-graphweaver';
import { InlineConfig } from 'vite';
import path from 'path';

export interface ViteConfigOptions {
	rootDirectory: string;
	host?: string;
}

export const viteConfig = (options: ViteConfigOptions): InlineConfig => ({
	configFile: false,
	root: options.rootDirectory,
	build: {
		outDir: path.resolve(process.cwd(), 'dist', 'admin-ui'),
	},
	server: {
		port: 8000,
		host: options.host,
	},
	optimizeDeps: {
		include: ['react-dom/client', 'react-dom'],
	},
	plugins: [svgr(), react(), graphweaver()],
});
