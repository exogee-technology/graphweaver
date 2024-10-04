import {
	Auth0,
	ForgottenPassword,
	MagicLinkLogin,
	MicrosoftEntra,
	PasswordLogin,
	ResetPassword,
} from './components';
import { Auth, Challenge } from './pages';
import { PrimaryAuthMethod } from './types';

const mapComponent = (method: PrimaryAuthMethod) => {
	switch (method) {
		case PrimaryAuthMethod.AUTH_ZERO:
			return <Auth0 />;
		case PrimaryAuthMethod.MAGIC_LINK:
			return <MagicLinkLogin />;
		case PrimaryAuthMethod.MICROSOFT_ENTRA:
			return <MicrosoftEntra />;
		case PrimaryAuthMethod.PASSWORD:
			return <PasswordLogin />;
		default:
			throw new Error(`Unknown primary auth method: ${method}`);
	}
};

export const loadRoutes = () => {
	const config = import.meta.env.VITE_GRAPHWEAVER_CONFIG;
	if (!config.auth) return [];

	const routes = new Set();
	const { primaryMethods, secondaryMethods, password } = config.auth;

	for (const method of primaryMethods) {
		const formattedMethodName = method.toLowerCase().replace('_', '-') + '-';
		const path = `${primaryMethods.length > 1 ? formattedMethodName : ''}login`;
		routes.add({
			path,
			element: mapComponent(method),
		});
	}

	if (secondaryMethods) {
		routes.add({
			path: 'challenge',
			element: <Challenge />,
		});
	}

	const hasPassword = primaryMethods.includes(PrimaryAuthMethod.PASSWORD);

	if (hasPassword && password?.enableForgottenPassword) {
		routes.add({
			path: 'forgot-password',
			element: <ForgottenPassword />,
		});
	}

	if (hasPassword && password?.enableResetPassword) {
		routes.add({
			path: 'reset-password',
			element: <ResetPassword />,
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
