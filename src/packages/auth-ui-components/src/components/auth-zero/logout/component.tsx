import { Logout } from '../../logout';
import { getAuth0Client } from '../client';

export const Auth0Logout = () => {
	const handleLogout = async () => {
		const client = await getAuth0Client();
		await client.logout();
	};

	return <Logout onLogout={handleLogout} />;
};
