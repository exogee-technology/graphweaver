import { DefaultErrorFallback, DefaultLayout } from '@exogee/graphweaver-admin-ui-components';
import { WelcomePage } from './welcome-page';

export const customPages: any = {
	defaultRoute: '/welcome',
	navLinks: async () => [{ name: 'Welcome', route: '/welcome' }],
	routes: () => [
		{
			element: <DefaultLayout />,
			errorElement: <DefaultErrorFallback />,
			children: [
				{
					path: '/welcome',
					element: <WelcomePage />,
				},
			],
		},
	],
};
