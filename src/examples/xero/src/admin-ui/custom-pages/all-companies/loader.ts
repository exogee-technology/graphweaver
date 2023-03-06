import { defer } from 'react-router-dom';
import { apolloClient } from '@exogee/graphweaver-admin-ui-components';
import { PROFIT_AND_LOSS } from './graphql';

export const AllCompaniesDashboardLoader = () =>
	defer({
		rows: apolloClient.query({
			query: PROFIT_AND_LOSS,
			variables: {
				description: 'Net Profit',
			},
		}),
	});
