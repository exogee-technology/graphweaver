import {
	AdminUiEntityMetadata,
	AdminUiMetadata,
	GraphweaverPluginNextFunction,
	GraphweaverRequestEvent,
	hookManagerMap,
	HookRegister,
	ReadHookParams,
} from '@exogee/graphweaver';
import { logger } from '@exogee/logger';
import { pluginManager, apolloPluginManager } from '@exogee/graphweaver-server';

import { RequestContext } from '../../authorization-context';
import { authApolloPlugin } from '../apollo';
import { getImplicitAllow } from '../../implicit-authorization';
import { ApplyAccessControlList } from '../../decorators/apply-access-control-list';
import { AclMap } from '../../helper-functions';
import { AuthorizationContext } from '../../types';

export class BaseAuthMethod {
	constructor() {
		this.addRequestContext();
		this.addApolloPlugin();
		this.ensureAdminUIMetadataIsAuthenticated();
		this.filterAdminUIMetadataColumns();
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

	private ensureAdminUIMetadataIsAuthenticated = async () => {
		// Ensure that accessing the admin ui metadata requires the user to be logged in
		// This will then redirect the user if not logged in
		// This is the default and can be overridden by the user first if needed
		if (!AclMap.has('AdminUiMetadata') && !getImplicitAllow()) {
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

	private filterAdminUIMetadataColumns = async () => {
		const afterRead = async (
			params: ReadHookParams<AdminUiEntityMetadata, AuthorizationContext>
		) => {
			// Filter out the priority column from the Task entity if the user is on the light side
			const entityName = 'Task';
			const preventedColumn = 'priority';

			// Filter out the prevented column from within the specificed entity
			const filteredEntities = params.entities?.map((entity) => {
				if (entity?.name === entityName) {
					const filteredFields = entity.fields?.filter((field) => field.name !== preventedColumn);
					return {
						...entity,
						fields: filteredFields,
					};
				}
				return entity;
			});

			return {
				...params,
				entities: filteredEntities,
			};
		};

		const hookManager = hookManagerMap.get('AdminUiMetadata');
		hookManager?.registerHook<ReadHookParams<AdminUiEntityMetadata, AuthorizationContext>>(
			HookRegister.AFTER_READ,
			afterRead
		);
	};
}
