import { loadAuthRoutes, AuthenticationMethod } from '@exogee/graphweaver-auth-ui-components';
import { WelcomePage } from './welcome-page';

export const customPages = {
	defaultRoute: '/welcome',
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
		...loadAuthRoutes([AuthenticationMethod.PASSWORD, AuthenticationMethod.FORGOTTEN_PASSWORD]),
	],
};
