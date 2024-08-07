import { useEffect, useState } from 'react';
import { createBrowserRouter, Navigate, RouteObject, RouterProvider } from 'react-router-dom';
import {
	Loader,
	DefaultLayout,
	DefaultErrorFallback,
	DetailPanel,
	Page404,
} from '@exogee/graphweaver-admin-ui-components';

// This is injected by vite-plugin-graphweaver
import { customPages } from 'virtual:graphweaver-user-supplied-custom-pages';
import { loadRoutes as loadAuthRoutes } from 'virtual:graphweaver-auth-ui-components';

import { List, Root, Playground, TraceDetail } from './pages';

const defaultRoutes: RouteObject[] = [
	{
		element: <DefaultLayout />,
		errorElement: <DefaultErrorFallback />,
		children: [
			{
				path: '/',
				element: customPages.defaultRoute ? <Navigate to={customPages.defaultRoute} /> : <Root />,
			},
			{
				path: 'Trace/:id',
				element: <TraceDetail />,
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
		path: '/playground',
		element: <Playground />,
	},
	{
		path: '*',
		element: <Page404 />,
	},
];

export const Router = () => {
	const [router, setRouter] = useState<ReturnType<typeof createBrowserRouter> | null>(null);

	useEffect(() => {
		(async () => {
			// We need to blend their custom routes in at the top so they can override us if they want.
			const routes = await customPages.routes();
			setRouter(
				createBrowserRouter([...routes, ...loadAuthRoutes(), ...defaultRoutes], {
					basename: import.meta.env.VITE_ADMIN_UI_BASE || '/',
				})
			);
		})();
	}, []);

	if (!router) return <Loader />;

	return <RouterProvider router={router} />;
};
