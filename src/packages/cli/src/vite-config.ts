import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import graphweaver from 'vite-plugin-graphweaver';
import { InlineConfig } from 'vite';

export const viteConfig: (viteRootDirectory: string) => InlineConfig = (
	viteRootDirectory: string
) => ({
	configFile: false,
	root: viteRootDirectory,
	server: {
		port: 8000,
	},
	plugins: [svgr(), react(), graphweaver()],
});
