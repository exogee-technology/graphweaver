import path from 'path';
import { createServer } from 'vite';
import { viteConfig } from '../vite-config';

export interface StartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
	port?: number /** Port to listen on, default is 9000  */;
}

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

	// Start vite.
	await server.listen();

	console.log(`🚀 Admin UI: ${server.resolvedUrls.local?.[0] || server.resolvedUrls.network?.[0]}`);
};
