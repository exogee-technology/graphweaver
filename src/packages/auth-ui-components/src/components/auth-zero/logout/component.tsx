import { Logout } from '../../logout';
import { getAuth0Client } from '../client';

type Auth0LogoutProps = {
	redirectTo?: string;
};

export const Auth0Logout = ({ redirectTo }: Auth0LogoutProps) => {
	const handleLogout = async () => {
		const client = await getAuth0Client();
		await client.logout({
			logoutParams: { returnTo: redirectTo ?? window.location.origin },
		});
	};

	return <Logout onLogout={handleLogout} />;
};
