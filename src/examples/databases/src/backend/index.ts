import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';
import { connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { resolvers } from './schema';

import { connections } from './database';

const graphweaver = new Graphweaver({
	resolvers: resolvers,
	apolloServerOptions: {
		plugins: [connectToDatabase(connections)],
	},
});

exports.handler = graphweaver.handler();
