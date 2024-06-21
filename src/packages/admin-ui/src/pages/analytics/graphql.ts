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
	query traces($filter: TracesListFilter, $pagination: TracesPaginationInput) {
		traces(filter: $filter, pagination: $pagination) {
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
