import { defer } from 'react-router-dom';
import { apolloClient } from '@exogee/graphweaver-admin-ui-components';

import { ProfitAndLossRowsAllCompaniesDocument } from '../../../../__generated__';

export const AllCompaniesDashboardLoader = () =>
	defer({
		rows: apolloClient.query({
			query: ProfitAndLossRowsAllCompaniesDocument,
			variables: {
				description: 'Net Profit',
			},
		}),
	});
