import {
	Auth0,
	ForgottenPassword,
	MagicLinkLogin,
	MicrosoftEntra,
	Okta,
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
		case PrimaryAuthMethod.OKTA:
			return <Okta />;
		default:
			throw new Error(`Unknown primary auth method: ${method}`);
	}
};

export const loadRoutes = () => {
	const config = import.meta.env.VITE_GRAPHWEAVER_CONFIG;
	if (!config.auth) return [];

	const routes: { path: string; element: React.ReactNode }[] = [];
	const { primaryMethods, secondaryMethods, password } = config.auth;

	for (const method of primaryMethods) {
		const formattedMethodName = method.toLowerCase().replace('_', '-') + '-';
		const path = `auth/${primaryMethods.length > 1 ? formattedMethodName : ''}login`;
		routes.push({
			path,
			element: <Auth>{mapComponent(method)}</Auth>,
		});
	}

	if (secondaryMethods) {
		routes.push({
			path: 'auth/challenge',
			element: (
				<Auth>
					<Challenge />
				</Auth>
			),
		});
	}

	const hasPassword = primaryMethods.includes(PrimaryAuthMethod.PASSWORD);

	if (hasPassword && password?.enableForgottenPassword) {
		routes.push({
			path: 'auth/forgot-password',
			element: (
				<Auth>
					<ForgottenPassword />
				</Auth>
			),
		});
	}

	if (hasPassword && password?.enableResetPassword) {
		routes.push({
			path: 'auth/reset-password',
			element: (
				<Auth>
					<ResetPassword />
				</Auth>
			),
		});
	}

	return routes;
};
