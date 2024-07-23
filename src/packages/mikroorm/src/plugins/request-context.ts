import {
	GraphweaverLifecycleEvent,
	GraphweaverNextFunction,
	GraphweaverPlugin,
} from '@exogee/graphweaver';
import { RequestContext } from '@mikro-orm/core';
import { ConnectionManager } from '..';
import { logger } from '@exogee/logger';

const connections = new Map<string, GraphweaverPlugin>();

export const requestContext = (connectionManagerId: string): GraphweaverPlugin => {
	const cachedPlugin = connections.get(connectionManagerId);

	if (cachedPlugin) {
		return cachedPlugin;
	}

	const connectionPlugin = {
		event: GraphweaverLifecycleEvent.OnRequest,
		next: (_: GraphweaverLifecycleEvent, next: GraphweaverNextFunction) => {
			logger.trace(`Graphweaver OnRequest plugin called`);

			const connection = ConnectionManager.database(connectionManagerId);
			if (!connection) throw new Error('No database connection found');

			return RequestContext.create(connection.orm.em, next, {});
		},
	};

	connections.set(connectionManagerId, connectionPlugin);

	return connectionPlugin;
};
