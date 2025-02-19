import { Route } from 'wouter';
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
		const path = `${primaryMethods.length > 1 ? formattedMethodName : ''}login`;
		routes.push({
			path,
			element: mapComponent(method),
		});
	}

	if (secondaryMethods) {
		routes.push({
			path: 'challenge',
			element: <Challenge />,
		});
	}

	const hasPassword = primaryMethods.includes(PrimaryAuthMethod.PASSWORD);

	if (hasPassword && password?.enableForgottenPassword) {
		routes.push({
			path: 'forgot-password',
			element: <ForgottenPassword />,
		});
	}

	if (hasPassword && password?.enableResetPassword) {
		routes.push({
			path: 'reset-password',
			element: <ResetPassword />,
		});
	}

	return [
		{
			path: '/auth',
			element: (
				<Auth>
					{routes.map((route) => (
						<Route key={route.path} path={route.path}>
							{route.element}
						</Route>
					))}
				</Auth>
			),
		},
	];
};
