import path from 'path';
import { build } from 'vite';
import { viteConfig } from '../vite-config';

export interface BuildOptions {}

export const buildFrontend = async (_: BuildOptions) => {
	const rootDirectory = path.resolve(require.resolve('@exogee/graphweaver-admin-ui'), '..', '..');
	const config = viteConfig({ rootDirectory });
	await build(config);

	console.log('Build complete!');
};
