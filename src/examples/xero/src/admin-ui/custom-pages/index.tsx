import { DefaultLayout, apolloClient } from '@exogee/graphweaver-admin-ui-components';
import { gql } from '@apollo/client';

import { XeroAuthCodeReceiver } from './xero-auth-code-receiver';
import { XeroDashboard } from './dashboards';
import { TenantsDocument } from './index.generated';

gql`
	query Tenants {
		tenants {
			id
			tenantName
		}
	}
`;

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
			element: (
				<DefaultLayout>
					<XeroDashboard />
				</DefaultLayout>
			),
		},
		{
			path: '/xero-dashboard/:tenantId',
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
