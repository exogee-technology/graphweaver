import { graphql } from '../../../../__generated__';

graphql(`
	query profitAndLossRowsSingleCompany($tenantId: ID!) {
		profitAndLossRows(filter: { tenantId: $tenantId }) {
			amount
			date
			description
			account {
				name
				type
			}
		}
	}
`);
