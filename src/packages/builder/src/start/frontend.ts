import path from 'path';
import type { ViteDevServer } from 'vite';
import { viteConfig } from '../vite-config';
import { config } from '@exogee/graphweaver-config';

export interface StartOptions {
	host?: string /** Host to listen on e.g. 0.0.0.0 */;
	port?: number /** Port to listen on, default is 9000  */;
}

let server: ViteDevServer | undefined = undefined;

export const startFrontend = async ({ host, port }: StartOptions) => {
	// Let's check if we need to start the server
	if (!server) {
		const { onResolveViteConfiguration } = config().start;

		// Generate a Vite Config
		const rootDirectory = path.resolve(
			require.resolve('@exogee/graphweaver-admin-ui'),
			'..',
			'..',
			'dist'
		);

		const backendUrl = new URL('/', 'http://localhost');
		backendUrl.port = String((port || 9000) + 1);

		// We're using the async import here because we're in CJS and vite's CJS entry point is
		// deprecated. Once we move to ESM, we can use the ESM entry point directly above.
		const { createServer } = await import('vite');
		server = await createServer(
			await onResolveViteConfiguration(
				await viteConfig({
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
The Graphweaver server has started. 😀😀

The GraphQL API is available at ${backendUrl.toString()}

Admin UI is available at ${
				server.resolvedUrls?.local?.[0] || server.resolvedUrls?.network?.[0] || 'Could not get URL'
			} 🚀

If you are new here, start with Admin UI.
`
		);
	}
};
