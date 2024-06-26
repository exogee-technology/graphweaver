import type { CustomPageConfiguration } from '@exogee/graphweaver-admin-ui-components';
import { WelcomePage } from './welcome-page';

export const customPages: CustomPageConfiguration = {
	defaultRoute: '/welcome',
	navLinks: async () => [{ name: 'Welcome', route: '/welcome' }],
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
	],
};
