import path from 'path';
import { createServer } from 'vite';
import { viteConfig } from '../vite-config';

export const startFrontend = async () => {
	// Start vite.
	const root = path.resolve(require.resolve('@exogee/graphweaver-admin-ui'), '..', '..');

	const server = await createServer(viteConfig(root));

	console.log('Graphweaver admin UI listening at:');
	await server.listen();
	server.printUrls();
};
