import { gql } from '@apollo/client';

export const csvExportOverrides = {
	Album: {
		mapResults: (csvExportRows: any[]) => {
			// Clean up the __typename field that gets added by GraphQL
			return csvExportRows.map((row) => {
				delete row.__typename;
				return row;
			});
		},
	},
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

						# This is the new part. It allows us to load the album ID for each track.
						# You can get as deeply nested as you need here, grab any information you'd like.
						album {
							albumId
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

				const uniqueTracks = new Set<string>();
				const uniqueAlbums = new Set<string>();

				for (const track of row.tracks) {
					uniqueTracks.add(track.value);
					uniqueAlbums.add(track.album.albumId);
				}

				return {
					...row,
					'Track Count': uniqueTracks.size,
					'Album Count': uniqueAlbums.size,

					// You can also derive any data you need from the data you've loaded.
					'Average Tracks Per Album': uniqueTracks.size / uniqueAlbums.size,
				};
			});
		},
	},
};
