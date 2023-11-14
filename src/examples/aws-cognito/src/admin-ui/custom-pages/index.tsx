import { Auth, Challenge, PasswordLogin } from '@exogee/graphweaver-auth-ui-components';

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
			],
		},
	],
};
