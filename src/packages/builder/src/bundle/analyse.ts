import path from 'path';
import type { PluginOption } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { viteConfig } from '../vite-config';

export const analyseBundle = async () => {
	// We're using the async import here because we're in CJS and vite's CJS entry point is
	// deprecated. Once we move to ESM, we can use the ESM entry point directly above.
	const { build } = await import('vite');

	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	const config = await viteConfig({ rootDirectory });

	await build({
		...config,
		plugins: [...(config.plugins || []), visualizer({ open: true })] as PluginOption[],
	});

	console.log('Build complete!');
};
