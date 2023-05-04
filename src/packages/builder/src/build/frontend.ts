import path from 'path';
import { build } from 'vite';
import { viteConfig } from '../vite-config';

export interface FrontendBuildOptions {}

export const buildFrontend = async (_: FrontendBuildOptions) => {
	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);
	const config = viteConfig({ rootDirectory });
	await build(config);

	console.log('Build complete!');
};
