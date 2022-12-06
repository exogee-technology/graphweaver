import { gql } from '@apollo/client';

export const SCHEMA_QUERY = gql`
	{
		result: _graphweaver {
			entities {
				name
				backendId
				fields {
					name
					type
					relationshipType
					relatedEntity
				}
			}
			enums {
				name
				values {
					name
					value
				}
			}
		}
	}
`;
