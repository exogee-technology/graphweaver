import 'reflect-metadata';
import Graphweaver from '@exogee/graphweaver-server';

import { eventbriteEvent, eventbriteOrder } from './schema';

const resolvers = [eventbriteEvent, eventbriteOrder];

const graphweaver = new Graphweaver({
	resolvers,
});

exports.handler = graphweaver.handler();
