import { useCallback } from 'react';
import { Logout } from '../../logout';
import { okta } from '../client';
import { localStorageAuthKey } from '@exogee/graphweaver-admin-ui-components';

export interface OktaLogoutProps {
	redirectTo?: string;
}

export const OktaLogout = ({ redirectTo }: OktaLogoutProps) => {
	const handleLogout = useCallback(async () => {
		localStorage.removeItem(localStorageAuthKey);
		await okta.signOut({ postLogoutRedirectUri: redirectTo });
	}, []);

	return <Logout onLogout={handleLogout} />;
};
