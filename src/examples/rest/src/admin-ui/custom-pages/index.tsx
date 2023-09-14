import { Login } from '@exogee/graphweaver-auth-ui-components';

export const customPages = {
	routes: () => [
		{
			path: '/login',
			element: <Login />,
		},
	],
};
