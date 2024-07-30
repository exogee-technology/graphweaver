import {
	AdminUiMetadata,
	GraphweaverPluginNextFunction,
	GraphweaverRequestEvent,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { pluginManager, apolloPluginManager } from '@exogee/graphweaver-server';

import { RequestContext } from '../../authorization-context';
import { authApolloPlugin } from '../apollo';
import { AclMap, ApplyAccessControlList } from '../..';

export class BaseAuthMethod {
	constructor() {
		this.addRequestContext();
		this.addApolloPlugin();
		this.enforceLoggedIn();
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

	private enforceLoggedIn = async () => {
		// Ensure that accessing the admin ui metadata requires the user to be logged in
		// This will then redirect the user if not logged in
		// This is the default and can be overridden by the user first if needed
		if (!AclMap.has('AdminUiMetadata')) {
			logger.trace('Adding AdminUiMetadata ACL');
			ApplyAccessControlList({
				Everyone: {
					all: (context) => !!context.token,
				},
			})(AdminUiMetadata);
		} else {
			logger.trace('AdminUiMetadata ACL already exists');
		}
	};
}
