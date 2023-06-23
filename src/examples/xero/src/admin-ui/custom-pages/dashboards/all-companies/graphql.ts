import { graphql } from '../../../../__generated__';

export interface LoaderData {
	data: {
		profitAndLossRows: ProfitAndLossRow[];
	};
}

export interface ProfitAndLossRow {
	amount: number;
	date: string;
	tenant: {
		id: string;
		tenantName: string;
	};
}

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
