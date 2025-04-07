import type { CustomPageConfiguration } from '@exogee/graphweaver-admin-ui-components';
import { WelcomePage } from './welcome-page';
import { Dashboard } from './dashboard';

export const customPages: CustomPageConfiguration = {
	defaultRoute: '/welcome',
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
		{
			path: '/dashboard',
			element: <Dashboard />,
		},
	],

	navLinks: async () => {
		return [{ name: 'Custom Dashboard', route: '/dashboard' }];
	},
};
