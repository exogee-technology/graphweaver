import path from 'path';
import { createServer } from 'vite';
import { viteConfig } from '../vite-config';

export interface StartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
}

export const startFrontend = async (options: StartOptions) => {
	// Generate a Vite Config
	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	const config = viteConfig({
		rootDirectory,
		host: options.host,
	});

	const server = await createServer(config);

	// Start vite.
	console.log('GraphWeaver Admin UI listening at:');
	await server.listen();
	server.printUrls();
};
