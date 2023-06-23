import { gql } from 'graphql-tag';

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

// import { useQuery } from '@apollo/client';
// graphql(`
// 	query Task {
// 		task(id: "2") {
// 			id
// 			description
// 			user {
// 				id
// 				name
// 			}
// 		}
// 	}
// `);
// const { data } = useQuery(TaskDocument, {
// 	fetchPolicy: 'network-only',
// });

// data.task.user.name;
