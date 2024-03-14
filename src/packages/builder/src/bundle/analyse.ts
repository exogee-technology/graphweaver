import path from 'path';
import { PluginOption, build } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { viteConfig } from '../vite-config';

export const analyseBundle = async () => {
	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	const config = viteConfig({ rootDirectory });

	await build({
		...config,
		plugins: [...(config.plugins || []), visualizer({ open: true })] as PluginOption[],
	});

	console.log('Build complete!');
};
