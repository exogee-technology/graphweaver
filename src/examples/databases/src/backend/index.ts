import Graphweaver from '@exogee/graphweaver-apollo';
import { ClearDatabaseContext, connectToDatabase } from '@exogee/graphweaver-mikroorm';

import { resolvers } from './schema';

import { connections } from './database';

const graphweaver = new Graphweaver({
	resolvers: resolvers,
	apolloServerOptions: {
		plugins: [connectToDatabase(connections), ClearDatabaseContext],
	},
});

exports.handler = graphweaver.handler();
