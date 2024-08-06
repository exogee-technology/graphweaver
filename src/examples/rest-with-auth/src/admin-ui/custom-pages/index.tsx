import { WelcomePage } from './welcome-page';

export const customPages = {
	defaultRoute: '/welcome',
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
	],
};
