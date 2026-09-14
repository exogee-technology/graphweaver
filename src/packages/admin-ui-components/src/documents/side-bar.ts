import { gql } from 'graphql-tag';

export const TENANTS_QUERY = gql`
	query TenantsQueryForSidebar {
		result: tenants {
			id
			tenantName
		}
	}
`;

export interface TenantsResult {
	result: {
		id: string;
		tenantName: string;
	}[];
}
