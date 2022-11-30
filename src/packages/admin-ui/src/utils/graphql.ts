import { gql } from '@apollo/client';

export const SCHEMA_QUERY = gql`
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
