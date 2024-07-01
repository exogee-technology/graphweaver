import { gql } from '@apollo/client';

export const queryForTrace = gql`
	query TracesList($id: String!) {
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
