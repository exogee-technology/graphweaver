import { Auth, Login, Challenge } from '.';

const password = [
	{
		path: '/auth',
		element: <Auth />,
		children: [
			{
				path: 'login',
				element: <Login />,
			},
			{
				path: 'challenge',
				element: <Challenge />,
			},
		],
	},
];

export const routes = { password };
