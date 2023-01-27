import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// This is injected by vite-plugin-graphweaver
import { dashboards } from 'virtual:graphweaver-user-supplied-dashboards';

import { Loader, DefaultLayout, ToolBar } from '@exogee/graphweaver-admin-ui-components';
import { List, Root } from './pages';

const defaultRoutes = [
	{
		path: '/',
		element: (
			<DefaultLayout>
				<Root />
			</DefaultLayout>
		),
	},
	{
		path: '/:entity',
		element: (
			<DefaultLayout header={<ToolBar />}>
				<List />
			</DefaultLayout>
		),
	},
	{
		path: '/:entity/:id',
		element: (
			<DefaultLayout header={<ToolBar />}>
				<List />
			</DefaultLayout>
		),
	},
	{
		path: '/loader',
		element: (
			<DefaultLayout>
				<Loader />
			</DefaultLayout>
		),
	},
];

export const Router = () => {
	const [router, setRouter] = useState<any>(null);

	useEffect(() => {
		(async () => {
			const routes = (await Promise.all(dashboards.map(({ routes }) => routes())))
				.flat()
				.filter((route) => route?.path);
			setRouter(createBrowserRouter([...defaultRoutes, ...routes]));
		})();
	}, []);

	if (!router) return <Loader />;

	return <RouterProvider router={router} />;
};
