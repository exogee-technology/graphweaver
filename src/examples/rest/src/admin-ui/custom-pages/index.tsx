import { Auth, Login, Challenge } from '@exogee/graphweaver-auth-ui-components';

export const customPages = {
	routes: () => [
		{
			path: '/auth',
			element: <Auth />,
			children: [
				{
					path: 'login',
					element: <Login />,
				},
				{
					path: 'challenge',
					element: <Challenge />,
				},
			],
		},
	],
};
