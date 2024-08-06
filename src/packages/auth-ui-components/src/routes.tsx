import { Auth, Challenge } from './pages';
import { ForgottenPassword, PasswordLogin, ResetPassword } from './components';

export enum AuthenticationMethod {
	PASSWORD = 'pwd',
	API_KEY = 'api',
	AUTH_ZERO = 'au0',
	FORGOTTEN_PASSWORD = 'fpd',
	MAGIC_LINK = 'mgl',
	ONE_TIME_PASSWORD = 'otp',
	WEB3 = 'wb3',
	PASSKEY = 'pky',
}

export const loadAuthRoutes = (authMethods: AuthenticationMethod[]) => {
	const routes = new Set();

	if (authMethods.includes(AuthenticationMethod.PASSWORD)) {
		routes.add({
			path: 'login',
			element: <PasswordLogin />,
		});
		routes.add({
			path: 'challenge',
			element: <Challenge />,
		});
	}

	if (authMethods.includes(AuthenticationMethod.FORGOTTEN_PASSWORD)) {
		routes.add({
			path: 'reset-password',
			element: <ResetPassword />,
		});
		routes.add({
			path: 'forgot-password',
			element: <ForgottenPassword />,
		});
	}

	return [
		{
			path: '/auth',
			element: <Auth />,
			children: Array.from(routes),
		},
	];
};
