import { gql } from 'graphql-request';

export const query = gql`
	query {
		_graphweaver {
			name
			backendId
			fields {
				name
				type
				relationshipType
				relatedEntity
			}
		}
	}
`;
