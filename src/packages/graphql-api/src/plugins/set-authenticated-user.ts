import { AuthenticationContext } from '@exogee/database-entities';
import { Role } from '../auth';
import { PluginDefinition } from 'apollo-server-core';

import { AuthorizationContext } from '../auth/authorization-context';

// This plugin tells our audit framework on each request if there's a logged in user in the session
// which user that is.
export const SetAuthenticatedUser: PluginDefinition = {
	async requestDidStart() {
		return {
			responseForOperation: async ({ context }) => {
				// TODO: Remove hard coded auth
				AuthenticationContext.set('DefaultUser');
				AuthorizationContext.set(Role.SUPER_ADMIN);
				return null;
			},

			willSendResponse: async () => {
				AuthenticationContext.clear();
			},
		};
	},
};
