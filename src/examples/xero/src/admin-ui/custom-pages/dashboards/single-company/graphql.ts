import { graphql } from '../../../../__generated__';

export interface LoaderData {
	data: {
		profitAndLossRows: ProfitAndLossRow[];
	};
}

export interface ProfitAndLossRow {
	amount: number;
	date: Date;
	description?: string;
	account: {
		name: string;
		type: string;
	};
}

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
