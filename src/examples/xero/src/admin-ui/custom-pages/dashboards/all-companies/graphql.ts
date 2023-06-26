import { graphql } from '../../../../__generated__';

graphql(`
	query profitAndLossRowsAllCompanies($description: String!) {
		profitAndLossRows(filter: { description: $description }) {
			amount
			date
			tenant {
				id
				tenantName
			}
		}
	}
`);
