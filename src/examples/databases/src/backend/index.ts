import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { resolvers } from './schema';

const graphweaver = new Graphweaver({
	resolvers,
});

exports.handler = graphweaver.handler();
