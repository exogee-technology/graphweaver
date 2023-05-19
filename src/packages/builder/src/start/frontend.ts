import { SocketAddress } from 'node:net';
import path from 'path';
import { createServer } from 'vite';
import { viteConfig } from '../vite-config';

export interface StartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
	port?: number /** Port to listen on, default is 9000  */;
}

const urlFromHttpServerAddress = (address?: string | SocketAddress): string => {
	if (!address) throw new Error('No address from vite dev server');
	if (typeof address === 'string') return address;
        if (address.address === "::1") return `localhost:${address.port}`;
	if (address.address.startsWith('::')) return `[${address.address}]:${address.port}`;
	return `${address.address}:${address.port}`;
};

export const startFrontend = async ({ host, port }: StartOptions) => {
	console.log('Starting Admin UI...');

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
		const url = urlFromHttpServerAddress(server.httpServer?.address());
		console.log(`🚀 Admin UI: http://${url}`);
	});

	// Start vite.
	await server.listen();
};
