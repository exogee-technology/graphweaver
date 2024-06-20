import { gql } from '@apollo/client';

export const queryForTrace = gql`
	query trace($id: String!) {
		traces(filter: { traceId: $id }, pagination: { orderBy: { timestamp: ASC } }) {
			id
			traceId
			parentId
			name
			timestamp
			duration
			attributes
		}
	}
`;

export const queryForTraces = gql`
	query traces {
		traces(filter: { parentId: null }, pagination: { orderBy: { timestamp: DESC } }) {
			id
			traceId
			parentId
			name
			timestamp
			duration
			attributes
		}
	}
`;
