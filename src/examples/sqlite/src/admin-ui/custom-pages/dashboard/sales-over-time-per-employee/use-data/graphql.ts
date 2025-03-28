import { gql } from '@exogee/graphweaver-admin-ui-components';

export const salesPerEmployee = gql`
	query salesPerEmployee {
		employees {
			employeeId
			firstName
			lastName
			customers {
				customerId
				invoices {
					invoiceId
					invoiceDate
					total
				}
			}
		}
	}
`;
