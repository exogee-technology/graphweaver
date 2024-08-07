import { Auth0Logout } from '@exogee/graphweaver-auth-ui-components';
import { WelcomePage } from './welcome-page';

export const customPages = {
	defaultRoute: '/welcome',
	sidebarFooter: () => <Auth0Logout redirectTo={`${window.location.origin}/auth/login`} />,
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
	],
};
