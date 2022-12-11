import { LoaderFunctionArgs, defer } from 'react-router-dom';
import { client } from '~/apollo';
import { PROFIT_AND_LOSS } from './graphql';

export const SingleCompanyDashboardLoader = ({ params: { tenantId } }: LoaderFunctionArgs) =>
	defer({
		rows: client.query({
			query: PROFIT_AND_LOSS,
			variables: {
				tenantId,
			},
		}),
	});
