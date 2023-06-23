import { LoaderFunctionArgs, defer } from 'react-router-dom';
import { apolloClient } from '@exogee/graphweaver-admin-ui-components';

import { ProfitAndLossRowsSingleCompanyDocument } from '../../../../__generated__';

export const SingleCompanyDashboardLoader = ({ params: { tenantId } }: LoaderFunctionArgs) =>
	defer({
		rows: apolloClient.query({
			query: ProfitAndLossRowsSingleCompanyDocument,
			variables: {
				tenantId,
			},
		}),
	});
