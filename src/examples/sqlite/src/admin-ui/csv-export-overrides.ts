import { gql } from '@apollo/client';

export const csvExportOverrides = {
	Genre: {
		// When exporting the Genre entity, we also want to include the album on the tracks.
		query: gql`
			query entityCSVExport($filter: GenresListFilter, $pagination: GenresPaginationInput) {
				result: genres(filter: $filter, pagination: $pagination) {
					genreId
					name
					tracks {
						value: trackId
						label: name

						# This is the new part. It allows us to load the album title for each track.
						album {
							title
						}
					}
				}
				aggregate: genres_aggregate(filter: $filter) {
					count
				}
			}
		`,

		mapResults: (csvExportRows: any[]) => {
			// The export is only going to be looking at keys in the row object, not nested ones,
			// so we need to hoist the album titles to the top level. They'll show up in the export
			// on a new column called "albums".
			return csvExportRows.map((row) => {
				delete row.__typename;

				const uniqueAlbums = new Set<string>();
				for (const track of row.tracks) {
					uniqueAlbums.add(track.album.title);
				}

				return {
					...row,
					'Album Count': uniqueAlbums.size,
				};
			});
		},
	},
};
