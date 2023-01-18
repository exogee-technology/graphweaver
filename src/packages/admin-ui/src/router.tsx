import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Loader } from './components/loader/component';
import {
	AllCompaniesDashboardLoader,
	SingleCompanyDashboardLoader,
	XeroDashboard,
} from './dashboads/xero';
import { DefaultLayout } from './layouts/default';
import { List, ListLoader, Root } from './pages';
import { ToolBar } from './components';

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
	{
		path: '/loader',
		element: (
			<DefaultLayout>
				<Loader />
			</DefaultLayout>
		),
	},
]);

export const Router = () => <RouterProvider router={router} />;
