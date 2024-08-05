import {
	Auth,
	Challenge,
	PasswordLogin,
	ForgottenPassword,
	ResetPassword,
} from '@exogee/graphweaver-auth-ui-components';
import { WelcomePage } from './welcome-page';

export const customPages = {
	defaultRoute: '/welcome',
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
		{
			path: '/auth',
			element: <Auth />,
			children: [
				{
					path: 'login',
					element: <PasswordLogin />,
				},
				{
					path: 'challenge',
					element: <Challenge />,
				},
				{
					path: 'reset-password',
					element: <ResetPassword />,
				},
				{
					path: 'forgot-password',
					element: <ForgottenPassword />,
				},
			],
		},
	],
};
