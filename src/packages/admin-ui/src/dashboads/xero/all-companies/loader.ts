import { defer } from 'react-router-dom';
import { client } from '~/apollo';
import { PROFIT_AND_LOSS } from './graphql';

export const AllCompaniesDashboardLoader = () =>
	defer({
		rows: client.query({
			query: PROFIT_AND_LOSS,
			variables: {
				description: 'Net Profit',
			},
		}),
	});
