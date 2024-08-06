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

import { getRolesFromAuthorizationContext, RequestContext } from '../../authorization-context';
import { authApolloPlugin } from '../apollo';
import { getImplicitAllow } from '../../implicit-authorization';
import { ApplyAccessControlList } from '../../decorators/apply-access-control-list';
import { AclMap, buildFieldAccessControlEntryForUser } from '../../helper-functions';
import {
	AccessType,
	AuthenticationMethod,
	AuthorizationContext,
	BASE_ROLE_EVERYONE,
} from '../../types';
import { getACL } from '../../auth-utils';
import { authManager } from '../../authentication-manager';

export class BaseAuthMethod {
	constructor(private methodType: AuthenticationMethod) {
		this.addRequestContext();
		this.addApolloPlugin();
		this.ensureAdminUIMetadataIsAuthenticated();
		this.filterAdminUIMetadataColumns();

		authManager.registerMethod(this.methodType);
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
			const entities = params.entities ?? [];
			const roles = [...getRolesFromAuthorizationContext(), BASE_ROLE_EVERYONE];

			for (const entity of entities) {
				if (!entity) continue;

				const acl = getACL(entity.name);
				const result = buildFieldAccessControlEntryForUser(acl, roles, params.context);

				const fields = result[AccessType.Read];
				if (fields) {
					const filteredFields = entity.fields?.filter((field) => !fields.has(field.name));
					entity.fields = filteredFields;
				}
			}

			return {
				...params,
				entities,
			};
		};

		const hookManager = hookManagerMap.get('AdminUiMetadata');
		hookManager?.registerHook<ReadHookParams<AdminUiEntityMetadata, AuthorizationContext>>(
			HookRegister.AFTER_READ,
			afterRead
		);
	};
}
