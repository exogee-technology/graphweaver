import { Auth, Challenge } from './pages';
import { ForgottenPassword, PasswordLogin, ResetPassword } from './components';

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
