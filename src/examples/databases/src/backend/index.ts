import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-apollo';

import { resolvers } from './schema';

const graphweaver = new Graphweaver({
	resolvers,
});

exports.handler = graphweaver.handler();
