import { gql } from '@apollo/client';

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

export const PROFIT_AND_LOSS = gql`
	query XeroDashboard($tenantId: ID!) {
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
`;
