import { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// This is injected by vite-plugin-graphweaver
import { customPages } from 'virtual:graphweaver-user-supplied-custom-pages';
import { Loader, DefaultLayout } from '@exogee/graphweaver-admin-ui-components';

import { List, ListToolBar, Root, Playground } from './pages';

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
			<DefaultLayout header={<ListToolBar />}>
				<List />
			</DefaultLayout>
		),
	},
	{
		path: '/:entity/:id',
		element: (
			<DefaultLayout header={<ListToolBar />}>
				<List />
			</DefaultLayout>
		),
	},
	{
		path: '/playground',
		element: <Playground />,
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
			const routes = (await customPages.routes()).flat().filter((route) => route?.path);
			setRouter(createBrowserRouter([...defaultRoutes, ...routes]));
		})();
	}, []);

	if (!router) return <Loader />;

	return <RouterProvider router={router} />;
};
