import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { resolvers } from './schema';

export const graphweaver = new Graphweaver({
	resolvers,
	enableValidationRules: true,
});

export const handler = graphweaver.handler();
