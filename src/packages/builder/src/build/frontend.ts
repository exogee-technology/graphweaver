import path from 'path';
import { build } from 'vite';
import rimrafCallback from 'rimraf';
import { config } from '@exogee/graphweaver-config';

import { viteConfig } from '../vite-config';
import { codeGenerator } from '../codegen';

export interface FrontendBuildOptions {
	adminUiBase?: string;
}

export const buildFrontend = async ({ adminUiBase }: FrontendBuildOptions) => {
	// Clear the folder
	rimrafCallback.sync(path.join('.graphweaver', 'admin-ui'));

	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	// We can now generate the front end functions and types
	await codeGenerator();

	const { onResolveViteConfiguration } = config().build;
	await build(onResolveViteConfiguration(viteConfig({ rootDirectory, base: adminUiBase })));

	console.log('Build complete!');
};
