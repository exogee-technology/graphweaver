import path from 'path';
import { build } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';
import { viteConfig } from '../vite-config';

export const analyseBundle = async () => {
	const root = path.resolve(require.resolve('@exogee/graphweaver-admin-ui'), '..', '..');

	const config = viteConfig(root);

	await build({
		...config,
		plugins: [...(config.plugins || []), visualizer({ open: true })],
	});

	console.log('Build complete!');
};
