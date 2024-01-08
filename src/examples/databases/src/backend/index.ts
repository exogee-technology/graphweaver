import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { resolvers } from './schema';

export const graphweaver = new Graphweaver({
	resolvers,
});

exports.handler = graphweaver.handler();
