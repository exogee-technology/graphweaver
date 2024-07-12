import {
	Auth,
	Challenge,
	PasswordLogin,
	ForgottenPassword,
	ResetPassword,
	Logout,
} from '@exogee/graphweaver-auth-ui-components';

export const customPages = {
	sidebarFooter: () => <Logout />,
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
