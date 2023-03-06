import { apolloClient, DefaultLayout } from '@exogee/graphweaver-admin-ui-components';
import { TENANTS_QUERY } from './dashboards/graphql';
import { XeroDashboard } from './dashboards/component';
import { AllCompaniesDashboardLoader } from './dashboards/all-companies';
import { SingleCompanyDashboardLoader } from './dashboards/single-company';
import { XeroAuthCodeReceiver } from './xero-auth-code-receiver';

export const customPages = {
	routes: () => [
		{
			// This is where Xero sends us back to after the OAuth flow.
			// Its job is to read the code and store it in local storage, then
			// redirect back to /.
			path: '/xero-auth-code',
			element: <XeroAuthCodeReceiver />,
		},
		{
			// These are dashboards
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
