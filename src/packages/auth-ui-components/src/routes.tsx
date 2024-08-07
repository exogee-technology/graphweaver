import { ForgottenPassword, MagicLinkLogin, PasswordLogin, ResetPassword } from './components';
import { Auth, Challenge } from './pages';

enum PrimaryAuthMethod {
	PASSWORD = 'PASSWORD',
	MAGIC_LINK = 'MAGIC_LINK',
	AUTH_ZERO = 'AUTH_ZERO',
}

const mapComponent = (method: PrimaryAuthMethod) => {
	switch (method) {
		case PrimaryAuthMethod.PASSWORD:
			return <PasswordLogin />;
		case PrimaryAuthMethod.MAGIC_LINK:
			return <MagicLinkLogin />;
		case PrimaryAuthMethod.AUTH_ZERO:
			return <MagicLinkLogin />;
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

	if (password.enableForgottenPassword) {
		routes.add({
			path: 'forgot-password',
			element: <ForgottenPassword />,
		});
	}

	if (password.enableResetPassword) {
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
