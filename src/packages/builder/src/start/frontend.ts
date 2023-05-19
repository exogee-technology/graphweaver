import path from 'path';
import { createServer } from 'vite';
import { viteConfig } from '../vite-config';

export interface StartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
	port?: number /** Port to listen on, default is 9000  */;
}

export const startFrontend = async ({ host, port }: StartOptions) => {

	console.log("Starting Admin UI...");

	// Generate a Vite Config
	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	const backendUrl = new URL('/', 'http://localhost');
	backendUrl.port = String((port || 9000) + 1);

	const config = viteConfig({
		rootDirectory,
		backendUrl: backendUrl.toString(),
		host,
		port,
	});

	const server = await createServer(config);

	server.httpServer?.on('listening', () => {
		const address = server.httpServer?.address();
		if (!address || typeof address === 'string')
			throw new Error('Could not retrieve address from the vite dev server');

		const { address: listeningAddress, port: listeningPort, family } = address;

		console.log(address);

		if (family === 'IPv6') {
			console.log(`🚀 Admin UI: http://[${listeningAddress}]:${listeningPort}`);
		} else {
			console.log(`🚀 Admin UI: http://${listeningAddress}:${listeningPort}`);
		}
	});

	// Start vite.
	await server.listen();
};
