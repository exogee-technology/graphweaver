import Graphweaver from '@exogee/graphweaver-server';
import { Server } from '@hapi/hapi';
import hapiApollo from '@as-integrations/hapi';

import './schema';

export const graphweaver = new Graphweaver({
	enableFederation: true,
});

const start = async () => {
	await graphweaver.server.start();
	// create the hapi server
	const hapi = new Server({
		host: '0.0.0.0',
		port: 4001,
	});

	await hapi.register({
		plugin: hapiApollo,
		options: {
			apolloServer: graphweaver.server,
			path: '/',
		},
	});

	await hapi.start();
	console.log('Server running on %s', hapi.info.uri)
};

start();
