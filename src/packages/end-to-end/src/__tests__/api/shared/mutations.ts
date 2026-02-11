import gql from 'graphql-tag';

// ── Create Mutations ──
export const CREATE_ARTIST = gql`
	mutation CreateArtist($input: ArtistInsertInput!) {
		createArtist(input: $input) {
			artistId
			name
		}
	}
`;

export const CREATE_ARTIST_WITH_ALBUMS = gql`
	mutation CreateArtist($input: ArtistInsertInput!) {
		createArtist(input: $input) {
			artistId
			name
			albums {
				albumId
				title
			}
		}
	}
`;

export const CREATE_ALBUM = gql`
	mutation CreateAlbum($input: AlbumInsertInput!) {
		createAlbum(input: $input) {
			albumId
			title
		}
	}
`;

export const CREATE_ALBUM_WITH_NESTED_ARTIST = gql`
	mutation CreateAlbum($input: AlbumInsertInput!) {
		createAlbum(input: $input) {
			albumId
			title
			artist {
				artistId
				name
			}
		}
	}
`;

export const CREATE_PLAYLIST = gql`
	mutation CreatePlaylist($input: PlaylistInsertInput!) {
		createPlaylist(input: $input) {
			playlistId
			name
		}
	}
`;

export const CREATE_PLAYLIST_WITH_TRACKS = gql`
	mutation CreatePlaylist($input: PlaylistInsertInput!) {
		createPlaylist(input: $input) {
			playlistId
			name
			tracks {
				trackId
				name
			}
		}
	}
`;

// ── Update Mutations ──
export const UPDATE_ARTIST = gql`
	mutation UpdateArtist($input: ArtistUpdateInput!) {
		updateArtist(input: $input) {
			artistId
			name
		}
	}
`;

export const UPDATE_ARTIST_WITH_ALBUMS = gql`
	mutation UpdateArtist($input: ArtistUpdateInput!) {
		updateArtist(input: $input) {
			artistId
			name
			albums {
				albumId
				title
			}
		}
	}
`;

export const UPDATE_ALBUM = gql`
	mutation UpdateAlbum($input: AlbumUpdateInput!) {
		updateAlbum(input: $input) {
			albumId
			title
			artist {
				artistId
				name
			}
		}
	}
`;

export const UPDATE_PLAYLIST = gql`
	mutation UpdatePlaylist($input: PlaylistUpdateInput!) {
		updatePlaylist(input: $input) {
			playlistId
			name
		}
	}
`;

export const UPDATE_PLAYLIST_WITH_TRACKS = gql`
	mutation UpdatePlaylist($input: PlaylistUpdateInput!) {
		updatePlaylist(input: $input) {
			playlistId
			name
			tracks {
				trackId
				name
			}
		}
	}
`;

// ── Delete Mutations ──
export const DELETE_ARTIST = gql`
	mutation DeleteArtist($filter: ArtistDeleteOneFilterInput!){
		deleteArtist(filter: $filter)
	}
`;

export const DELETE_ALBUM = gql`
	mutation DeleteAlbum($filter: AlbumDeleteOneFilterInput!){
		deleteAlbum(filter: $filter)
	}
`;

export const DELETE_PLAYLIST = gql`
	mutation DeletePlaylist($filter: PlaylistDeleteOneFilterInput!){
		deletePlaylist(filter: $filter)
	}
`;

// ── Query Helpers ──
export const GET_ARTISTS = gql`
	query Artists {
		artists {
			artistId
			name
		}
	}
`;

export const GET_ALBUMS = gql`
	query Albums {
		albums {
			albumId
			title
		}
	}
`;

export const GET_PLAYLISTS = gql`
	query Playlists {
		playlists {
			playlistId
			name
		}
	}
`;

export const GET_PLAYLIST_WITH_TRACKS = gql`
	query Playlist($filter: PlaylistsListFilter) {
		playlists(filter: $filter) {
			playlistId
			name
			tracks {
				trackId
				name
			}
		}
	}
`;
