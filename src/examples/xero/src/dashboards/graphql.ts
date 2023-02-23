import { gql } from 'graphql-tag';

export const TENANTS_QUERY = gql`
	{
		result: tenants {
			id
			tenantName
		}
	}
`;
