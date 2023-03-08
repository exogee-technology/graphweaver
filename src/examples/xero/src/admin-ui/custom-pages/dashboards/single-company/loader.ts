import { LoaderFunctionArgs, defer } from 'react-router-dom';
import { apolloClient } from '@exogee/graphweaver-admin-ui-components';
import { PROFIT_AND_LOSS } from './graphql';

export const SingleCompanyDashboardLoader = ({ params: { tenantId } }: LoaderFunctionArgs) =>
	defer({
		rows: apolloClient.query({
			query: PROFIT_AND_LOSS,
			variables: {
				tenantId,
			},
		}),
	});
