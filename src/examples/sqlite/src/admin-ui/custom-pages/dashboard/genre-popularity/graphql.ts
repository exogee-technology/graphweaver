import { gql } from '@exogee/graphweaver-admin-ui-components';

export const genrePopularity = gql`
	query genrePopularity {
		genres {
			genreId
			name
			tracks {
				trackId
				invoiceLines {
					invoiceLineId
					quantity
				}
			}
			tracks_aggregate {
				count
			}
		}
	}
`;
