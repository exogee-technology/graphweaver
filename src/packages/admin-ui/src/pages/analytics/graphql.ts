import { gql } from '@apollo/client';

export const queryForTrace = gql`
	query {
		traces(
			filter: { traceId: "a376436d11e530e2a47efe2d43d7f9ec" }
			pagination: { orderBy: { timestamp: ASC } }
		) {
			id
			traceId
			parentId
			name
			timestamp
			duration
		}
	}
`;
