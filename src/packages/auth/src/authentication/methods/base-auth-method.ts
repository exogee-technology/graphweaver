import { GraphweaverPluginNextFunction, GraphweaverRequestEvent } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { pluginManager } from '@exogee/graphweaver-server';

import { RequestContext } from '../../authorization-context';

export class BaseAuthMethod {
	constructor() {
		this.addRequestContext();
	}

	private addRequestContext = () => {
		const connectionPlugin = {
			name: 'AuthRequestContextPlugin',
			event: GraphweaverRequestEvent.OnRequest,
			next: (_: GraphweaverRequestEvent, _next: GraphweaverPluginNextFunction) => {
				logger.trace(`Graphweaver OnRequest AuthRequestContextPlugin plugin called`);

				return RequestContext.create(_next);
			},
		};
		pluginManager.addPlugin(connectionPlugin);
	};
}
