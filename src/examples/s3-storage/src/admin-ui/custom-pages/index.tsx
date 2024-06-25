import { WelcomePage } from './welcome-page';

export const customPages: any = {
	defaultRoute: '/welcome',
	navLinks: async () => [{ name: 'Welcome', route: '/welcome' }],
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
	],
};
