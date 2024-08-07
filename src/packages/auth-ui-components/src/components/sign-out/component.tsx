import { PrimaryAuthMethod } from '../../types';
import { Auth0Logout } from '../auth-zero';
import { Logout } from '../logout';

export const SignOut = () => {
	try {
		const config = import.meta.env.VITE_GRAPHWEAVER_CONFIG;
		if (!config.auth) return null;

		if (config.auth.primaryMethods.includes(PrimaryAuthMethod.AUTH_ZERO)) {
			return <Auth0Logout redirectTo={`${window.location.origin}/auth/login`} />;
		}
		return <Logout />;
	} catch (error) {
		console.error('Failed to load configuration:', error);
		return null;
	}
};
