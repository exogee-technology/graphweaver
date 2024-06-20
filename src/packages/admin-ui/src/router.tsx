import { useEffect, useState } from 'react';
import { createBrowserRouter, Outlet, RouteObject, RouterProvider } from 'react-router-dom';
import {
	Loader,
	DefaultLayout,
	DefaultErrorFallback,
	DetailPanel,
} from '@exogee/graphweaver-admin-ui-components';

// This is injected by vite-plugin-graphweaver
import { customPages } from 'virtual:graphweaver-user-supplied-custom-pages';
import { List, Root, Playground, TraceList, TraceDetail } from './pages';

const defaultRoutes: RouteObject[] = [
	{
		path: '/',
		element: <DefaultLayout />,
		errorElement: <DefaultErrorFallback />,
		children: [
			{
				path: '/',
				element: <Root />,
			},
			{
				path: '/traces',
				element: <Outlet />,

				children: [
					{
						element: <TraceList />,
						index: true,
					},
					{
						path: ':id',
						element: <TraceDetail />,
					},
				],
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
];

export const Router = () => {
	const [router, setRouter] = useState<ReturnType<typeof createBrowserRouter> | null>(null);

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
