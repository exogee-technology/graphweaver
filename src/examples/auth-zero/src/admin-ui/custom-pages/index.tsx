import { Auth, Auth0 } from '@exogee/graphweaver-auth-ui-components';

export const customPages = {
	routes: () => [
		{
			path: '/auth',
			element: <Auth />,
			children: [
				{
					path: 'login',
					element: <Auth0 />,
				},
			],
		},
	],
};
