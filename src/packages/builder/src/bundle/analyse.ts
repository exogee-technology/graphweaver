import path from 'path';
import { build } from 'vite';
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
		plugins: [...(config.plugins || []), visualizer({ open: true })],
	});

	console.log('Build complete!');
};
