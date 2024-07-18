import { Auth, Auth0, Auth0Logout } from '@exogee/graphweaver-auth-ui-components';

export const customPages = {
	sidebarFooter: () => <Auth0Logout redirectTo={`${window.location.origin}/auth/login`} />,
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
