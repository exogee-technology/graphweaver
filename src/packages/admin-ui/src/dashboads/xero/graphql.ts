import { gql } from '@apollo/client';

export interface ProfitAndLossResult {
	profitAndLossRows: ProfitAndLossRow[];
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
	query XeroDashboard {
		profitAndLossRows {
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
