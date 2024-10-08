import { useCallback } from 'react';
import { Logout } from '../../logout';
import { publicClientApplication } from '../client';

export interface MicrosoftEntraLogoutProps {
	redirectTo?: string;
}

export const MicrosoftEntraLogout = ({ redirectTo }: MicrosoftEntraLogoutProps) => {
	const handleLogout = useCallback(async () => {
		await publicClientApplication.logoutRedirect({ postLogoutRedirectUri: redirectTo });
	}, []);

	return <Logout onLogout={handleLogout} />;
};
