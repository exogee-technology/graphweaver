import { apolloClient, DefaultLayout } from '@exogee/graphweaver-admin-ui-components';

import { XeroAuthCodeReceiver } from './xero-auth-code-receiver';
import {
	XeroDashboard,
	AllCompaniesDashboardLoader,
	SingleCompanyDashboardLoader,
} from './dashboards';
import { TenantsDocument } from '../../__generated__';

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
		const { data } = await apolloClient.query({ query: TenantsDocument });

		if (!Array.isArray(data.tenants)) return;

		return [
			{ name: 'All Companies', route: '/xero-dashboard' },
			...data.tenants.map((tenant) => ({
				name: tenant.tenantName,
				route: `/xero-dashboard/${tenant.id}`,
			})),
		];
	},
};
