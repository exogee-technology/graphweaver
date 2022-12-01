import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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
]);

export const Router = () => <RouterProvider router={router} />;
