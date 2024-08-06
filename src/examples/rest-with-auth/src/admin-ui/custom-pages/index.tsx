import { loadAuthRoutes } from '@exogee/graphweaver-auth-ui-components';
import { WelcomePage } from './welcome-page';

export const customPages = {
	defaultRoute: '/welcome',
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
		...loadAuthRoutes(),
	],
};
