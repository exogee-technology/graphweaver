import { spawn } from 'child_process';
import path from 'path';
import yargs from 'yargs/yargs';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import graphweaver from 'vite-plugin-graphweaver';

(async () => {
	const { command, scope } = await yargs(process.argv.slice(2))
		.env('GRAPHWEAVER')
		.options({
			scope: {
				alias: 's',
				default: 'all',
				choices: ['backend', 'frontend', 'all'],
			},
			command: {
				alias: 'c',
				default: 'start',
				choices: ['start', 'build'],
			},
		}).argv;

	switch (command) {
		case 'build':
			if (scope === 'backend' || scope === 'all') {
				console.log('Backend build not yet implemented.');
			}
			if (scope === 'frontend' || scope === 'all') {
				console.log('Frontend build not yet implemented.');
			}
			return;

		case 'start':
			if (scope === 'backend' || scope === 'all') {
				console.log('Backend start not yet implemented.');
			}
			if (scope === 'frontend' || scope === 'all') {
				// Start vite.
				const adminPackageRoot = path.resolve(
					require.resolve('@exogee/graphweaver-admin-ui'),
					'..',
					'..'
				);

				console.log('starting in ', adminPackageRoot);

				const server = await createServer({
					configFile: false,
					root: adminPackageRoot,
					server: {
						port: 8000,
					},
					resolve: {
						alias: {
							'~': path.resolve(adminPackageRoot, 'src'),
						},
					},
					plugins: [svgr(), react(), graphweaver()],
				});

				await server.listen();

				server.printUrls();
			}
			return;
	}
})();
