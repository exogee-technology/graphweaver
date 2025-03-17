import { DefaultLayout, apolloClient } from '@exogee/graphweaver-admin-ui-components';
import { gql } from '@apollo/client';

import { XeroAuthCodeReceiver } from './xero-auth-code-receiver';
import { AllCompanies, SingleCompany } from './dashboards';
import { TenantsQuery } from './index.generated';
import { WelcomePage } from './welcome-page';
import { Route } from 'wouter';

const tenantsQuery = gql`
	query Tenants {
		tenants {
			id
			tenantName
		}
	}
`;

export const customPages = {
	defaultRoute: '/welcome',
	routes: () => [
		{
			path: '/welcome',
			element: <WelcomePage />,
		},
		{
			// This is where Xero sends us back to after the OAuth flow.
			// Its job is to read the code and store it in local storage, then
			// redirect back to /.
			path: '/xero-auth-code',
			element: <XeroAuthCodeReceiver />,
		},
		{
			path: 'xero-dashboard',
			element: (
				<DefaultLayout>
					<Route path="/:tenantId">
						<SingleCompany />
					</Route>
					<Route path="/">
						<AllCompanies />
					</Route>
				</DefaultLayout>
			),
		},
	],

	navLinks: async () => {
		// To know nav links we need to know the tenants.
		const { data } = await apolloClient.query<TenantsQuery>({ query: tenantsQuery });

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
