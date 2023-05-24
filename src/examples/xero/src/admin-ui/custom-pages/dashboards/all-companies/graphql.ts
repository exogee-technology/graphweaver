import { gql } from 'graphql-tag';

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

export const PROFIT_AND_LOSS = gql`
	query XeroDashboard($description: String!) {
		profitAndLossRows(filter: { description: $description }) {
			amount
			date
			tenant {
				id
				tenantName
			}
		}
	}
`;
