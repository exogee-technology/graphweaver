import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { XeroDashboard } from './dashboads/xero';
import { DefaultLayout } from './layouts/default';
import { List, ListLoader, Root } from './pages';

const router = createBrowserRouter([
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
			<DefaultLayout>
				<List />
			</DefaultLayout>
		),
		loader: ListLoader,
	},
	{
		path: '/:entity/:id',
		element: (
			<DefaultLayout>
				<List />
			</DefaultLayout>
		),
		loader: ListLoader,
	},
	{
		path: '/dashboard/:id',
		element: (
			<DefaultLayout>
				<XeroDashboard />
			</DefaultLayout>
		),
	},
]);

export const Router = () => <RouterProvider router={router} />;
