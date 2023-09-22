import { Auth, PasswordLogin, PasswordChallenge, MagicLinkLogin, MagicLinkVerify } from '.';

const password = [
	{
		path: '/auth/password',
		element: <Auth />,
		children: [
			{
				path: 'login',
				element: <PasswordLogin />,
			},
			{
				path: 'challenge',
				element: <PasswordChallenge />,
			},
		],
	},
];

const magicLink = [
	{
		path: '/auth/magic-link',
		element: <Auth />,
		children: [
			{
				path: 'login',
				element: <MagicLinkLogin />,
			},
			{
				path: 'verify',
				element: <MagicLinkVerify />,
			},
		],
	},
];

export const routes = { password, magicLink };
