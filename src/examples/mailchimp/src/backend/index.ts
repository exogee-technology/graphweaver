import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { interest, category, mailingList, member } from './schema';

const resolvers = [interest, category, mailingList, member];

const graphweaver = new Graphweaver({
	resolvers,
});

exports.handler = graphweaver.handler();
