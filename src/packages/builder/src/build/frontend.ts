import path from 'path';
import { rimraf } from 'rimraf';
import { config } from '@exogee/graphweaver-config';

import { viteConfig } from '../vite-config';

export interface FrontendBuildOptions {
	adminUiBase?: string;
}

export const buildFrontend = async ({ adminUiBase }: FrontendBuildOptions) => {
	// We're using the async import here because we're in CJS and vite's CJS entry point is
	// deprecated. Once we move to ESM, we can use the ESM entry point directly above.
	const { build } = await import('vite');

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
