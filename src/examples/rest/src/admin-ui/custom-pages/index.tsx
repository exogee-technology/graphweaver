import {
	Auth,
	Challenge,
	PasswordLogin,
	ForgottenPassword,
	ResetPassword,
} from '@exogee/graphweaver-auth-ui-components';

const canResetPassword = true;
export const customPages = {
	routes: () => [
		{
			path: '/auth',
			element: <Auth />,
			children: [
				{
					path: 'login',
					element: <PasswordLogin canResetPassword={canResetPassword} />,
				},
				{
					path: 'challenge',
					element: <Challenge />,
				},
				canResetPassword && {
					path: 'reset-password',
					element: <ResetPassword />,
				},
				canResetPassword && {
					path: 'forgot-password',
					element: <ForgottenPassword />,
				},
			],
		},
	],
};
