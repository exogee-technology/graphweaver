import path from 'path';
import { ViteDevServer, createServer } from 'vite';
import { viteConfig } from '../vite-config';
import { config } from '@exogee/graphweaver-config';
import { codeGenerator } from '../codegen';

export interface StartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
	port?: number /** Port to listen on, default is 9000  */;
}

let server: ViteDevServer | undefined = undefined;

export const startFrontend = async ({ host, port }: StartOptions) => {
	const { onResolveViteConfiguration } = config().start;

	// Generate a Vite Config
	const rootDirectory = path.resolve(
		require.resolve('@exogee/graphweaver-admin-ui'),
		'..',
		'..',
		'dist'
	);

	// We can now generate the front end functions and types
	await codeGenerator();

	const backendUrl = new URL('/', 'http://localhost');
	backendUrl.port = String((port || 9000) + 1);

	if (server) {
		server.restart();
	} else {
		server = await createServer(
			onResolveViteConfiguration(
				viteConfig({
					rootDirectory,
					backendUrl: backendUrl.toString(),
					host,
					port,
				})
			)
		);
		// Start vite.
		await server.listen();

		console.log(
			`
Admin UI: ${
				server.resolvedUrls?.local?.[0] || server.resolvedUrls?.network?.[0] || 'Could not get URL'
			} 🚀

`
		);
	}
};
