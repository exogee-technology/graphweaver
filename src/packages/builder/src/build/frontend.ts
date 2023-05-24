import path from 'path';
import { build } from 'vite';
import rimrafCallback from 'rimraf';

import { viteConfig } from '../vite-config';

export interface FrontendBuildOptions {}

export const buildFrontend = async (_: FrontendBuildOptions) => {
	// Clear the folder
	rimrafCallback.sync(path.join('.graphweaver', 'admin-ui'));

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
