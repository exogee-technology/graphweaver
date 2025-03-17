import { PrimaryAuthMethod } from '../../types';
import { Auth0Logout } from '../auth-zero';
import { Logout } from '../logout';
import { OktaLogout } from '../okta';

export const SignOut = () => {
	try {
		const config = import.meta.env.VITE_GRAPHWEAVER_CONFIG;
		if (!config.auth) return null;

		if (config.auth.primaryMethods.includes(PrimaryAuthMethod.AUTH_ZERO)) {
			return <Auth0Logout redirectTo={`${window.location.origin}/auth/login`} />;
		}
		if (config.auth.primaryMethods.includes(PrimaryAuthMethod.OKTA)) {
			return <OktaLogout />;
		}
		return <Logout />;
	} catch (error) {
		console.error('Failed to load configuration:', error);
		return null;
	}
};
