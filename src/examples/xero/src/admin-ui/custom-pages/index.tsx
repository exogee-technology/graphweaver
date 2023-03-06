import { apolloClient, DefaultLayout } from '@exogee/graphweaver-admin-ui-components';
import { TENANTS_QUERY } from './graphql';
import { XeroDashboard } from './component';
import { AllCompaniesDashboardLoader } from './all-companies';
import { SingleCompanyDashboardLoader } from './single-company';

export const customPages = {
	routes: () => [
		{
			path: '/xero-dashboard',
			loader: AllCompaniesDashboardLoader,
			element: (
				<DefaultLayout>
					<XeroDashboard />
				</DefaultLayout>
			),
		},
		{
			path: '/xero-dashboard/:tenantId',
			loader: SingleCompanyDashboardLoader,
			element: (
				<DefaultLayout>
					<XeroDashboard />
				</DefaultLayout>
			),
		},
	],

	navLinks: async () => {
		// To know nav links we need to know the tenants.
		const { data } = await apolloClient.query({ query: TENANTS_QUERY });
		if (!Array.isArray(data.result)) return;

		return [
			{ name: 'All Companies', route: '/xero-dashboard' },
			...data.result.map((tenant) => ({
				name: tenant.tenantName,
				route: `/xero-dashboard/${tenant.id}`,
			})),
		];
	},
};
