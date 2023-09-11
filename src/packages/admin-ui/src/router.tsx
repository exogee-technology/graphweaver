import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// This is injected by vite-plugin-graphweaver
import { customPages } from 'virtual:graphweaver-user-supplied-custom-pages';
import { Loader, DefaultLayout, DetailPanel } from '@exogee/graphweaver-admin-ui-components';

import { List, Root, Playground, Login } from './pages';

const defaultRoutes = [
	{
		path: '/',
		element: <DefaultLayout />,
		children: [
			{
				path: '/',
				element: <Root />,
			},
			{
				path: ':entity',
				element: <List />,
				children: [
					{
						path: ':id',
						element: <DetailPanel />,
					},
				],
			},
			{
				path: 'loader',
				element: <Loader />,
			},
		],
	},
	{
		path: '/login',
		element: <Login {...(customPages?.loginProps ?? {})} />,
	},
	{
		path: '/playground',
		element: <Playground />,
	},
];

export const Router = () => {
	const [router, setRouter] = useState<any>(null);

	useEffect(() => {
		(async () => {
			const routes = (await customPages.routes()).flat().filter((route) => route?.path);
			setRouter(
				createBrowserRouter([...defaultRoutes, ...routes], {
					basename: import.meta.env.VITE_ADMIN_UI_BASE || '/',
				})
			);
		})();
	}, []);

	if (!router) return <Loader />;

	return <RouterProvider router={router} />;
};
