import { Logout } from '../../logout';
import { useMsal } from '@azure/msal-react';
import { MicrosoftEntraProvider } from '../client';

type MicrosoftEntraLogoutProps = {
	redirectTo?: string;
};

const LogoutComponent = ({ redirectTo }: MicrosoftEntraLogoutProps) => {
	const { instance } = useMsal();

	const handleLogout = async () => {
		await instance.logout({ postLogoutRedirectUri: redirectTo });
	};

	return <Logout onLogout={handleLogout} />;
};

export const MicrosoftEntraLogout = ({ redirectTo }: MicrosoftEntraLogoutProps) => (
	<MicrosoftEntraProvider>
		<LogoutComponent redirectTo={redirectTo} />
	</MicrosoftEntraProvider>
);
