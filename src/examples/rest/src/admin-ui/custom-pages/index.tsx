import {
	Auth,
	Challenge,
	PasswordLogin,
	ForgottenPassword,
	ResetPassword,
} from '@exogee/graphweaver-auth-ui-components';

export const customPages = {
	routes: () => [
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
				// @todo - make these paths optional via a config
				{
					path: 'forgot-password',
					element: <ForgottenPassword />,
				},
				{
					path: 'reset-password',
					element: <ResetPassword />,
				},
			],
		},
	],
};
