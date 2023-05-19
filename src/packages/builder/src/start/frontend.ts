import path from 'path';
import { createServer } from 'vite';
import { viteConfig } from '../vite-config';

export interface StartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
	port: number /** Port to listen on, default is 9000  */;
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
		port: options.port || 9000
	});

	const server = await createServer(config);

	// Start vite.
	console.log('GraphWeaver Admin UI listening at:');
	await server.listen();
	server.printUrls();
};
