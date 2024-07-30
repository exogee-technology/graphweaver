import { GraphweaverPluginNextFunction, GraphweaverRequestEvent } from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { pluginManager, apolloPluginManager } from '@exogee/graphweaver-server';

import { RequestContext } from '../../authorization-context';
import { authApolloPlugin } from '../apollo';

export class BaseAuthMethod {
	constructor() {
		this.addRequestContext();
		this.addApolloPlugin();
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

	private addApolloPlugin = () => {
		apolloPluginManager.addPlugin('AuthApolloPlugin', authApolloPlugin());
	};
}
