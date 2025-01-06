import { Logout } from '../../logout';
import { okta } from '../client';
import { localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';

export const OktaLogout = () => (
	<Logout
		onLogout={async () => {
			localStorage.removeItem(localStorageAuthKey);

			await okta.signOut({
				// Always go back to the root.
				postLogoutRedirectUri: window.location.origin,
				revokeAccessToken: true,
				revokeRefreshToken: true,
				clearTokensBeforeRedirect: true,
			});
		}}
	/>
);
