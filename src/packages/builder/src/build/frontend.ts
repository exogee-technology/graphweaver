import path from 'path';
import { build } from 'vite';
import { rimraf } from 'rimraf';
import { config } from '@exogee/graphweaver-config';

import { viteConfig } from '../vite-config';

export interface FrontendBuildOptions {
	adminUiBase?: string;
}

export const buildFrontend = async ({ adminUiBase }: FrontendBuildOptions) => {
	// Clear the folder
	await rimraf(path.join('.graphweaver', 'admin-ui'));

	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	const { onResolveViteConfiguration } = config().build;
	await build(onResolveViteConfiguration(viteConfig({ rootDirectory, base: adminUiBase })));

	console.log('Build complete!');
};
