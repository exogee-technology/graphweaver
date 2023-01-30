import path from 'path';
import { build } from 'vite';
import { viteConfig } from '../vite-config';

export const buildFrontend = async () => {
	const root = path.resolve(require.resolve('@exogee/graphweaver-admin-ui'), '..', '..');

	await build(viteConfig(root));

	console.log('Build complete!');
};
