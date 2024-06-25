import { gql } from '@apollo/client';

export const queryForTrace = gql`
	query trace($id: String!) {
		traces(filter: { traceId: $id }, pagination: { orderBy: { timestamp: ASC } }) {
			id
			spanId
			traceId
			parentId
			name
			timestamp
			duration
			attributes
		}
	}
`;
