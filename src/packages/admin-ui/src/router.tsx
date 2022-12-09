import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import {
	AllCompaniesDashboardLoader,
	SingleCompanyDashboardLoader,
	XeroDashboard,
} from './dashboads/xero';
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
		loader: ListLoader,
		element: (
			<DefaultLayout>
				<List />
			</DefaultLayout>
		),
	},
	{
		path: '/:entity/:id',
		loader: ListLoader,
		element: (
			<DefaultLayout>
				<List />
			</DefaultLayout>
		),
	},
	{
		path: '/dashboard',
		loader: AllCompaniesDashboardLoader,
		element: (
			<DefaultLayout>
				<XeroDashboard />
			</DefaultLayout>
		),
	},
	{
		path: '/dashboard/:tenantId',
		loader: SingleCompanyDashboardLoader,
		element: (
			<DefaultLayout>
				<XeroDashboard />
			</DefaultLayout>
		),
	},
]);

export const Router = () => <RouterProvider router={router} />;
