import fs from 'node:fs/promises';
import path from 'node:path';
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

	// Clear the folders
	await rimraf(path.join('.graphweaver', 'admin-ui'));
	await rimraf(path.join('dist', 'admin-ui'));

	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	const { onResolveViteConfiguration } = config().build;
	const resolvedViteConfig = await onResolveViteConfiguration(
		await viteConfig({ rootDirectory, base: adminUiBase })
	);
	await build(resolvedViteConfig);

	// Now that the admin UI is in .graphweaver, we also need to copy it to the dist folder for people to be able to find the output.
	const fromDir = resolvedViteConfig.build?.outDir ?? path.join('.graphweaver', 'admin-ui');
	await fs.cp(fromDir, path.join('dist', 'admin-ui'), { recursive: true });

	console.log('Build complete!');
};
