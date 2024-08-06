import { Auth, Challenge } from './pages';
import { ForgottenPassword, PasswordLogin, ResetPassword } from './components';

// enum AuthenticationMethod {
// 	PASSWORD = 'pwd',
// 	MAGIC_LINK = 'mgl',
// 	ONE_TIME_PASSWORD = 'otp',
// 	WEB3 = 'wb3',
// 	PASSKEY = 'pky',
// }

export const loadAuthRoutes = () => {
	return [
		{
			path: '/auth',
			element: <Auth />,
			children: [
				{
					path: 'login',
					element: <PasswordLogin />,
				},
				{
					path: 'challenge',
					element: <Challenge />,
				},
				{
					path: 'reset-password',
					element: <ResetPassword />,
				},
				{
					path: 'forgot-password',
					element: <ForgottenPassword />,
				},
			],
		},
	];
};
