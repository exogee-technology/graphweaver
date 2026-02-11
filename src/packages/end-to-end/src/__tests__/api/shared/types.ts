export type Artist = {
	artistId: string;
	name: string;
	albums?: Album[];
};

export type Album = {
	albumId: string;
	title: string;
	artist?: Artist;
	tracks?: Track[];
};

export type Track = {
	trackId: string;
	name: string;
	album?: Album;
	genre?: Genre;
	mediaType?: { mediaTypeId: string; name: string };
	composer?: string;
	milliseconds: number;
	bytes?: number;
	unitPrice: string;
	playlists?: Playlist[];
};

export type Genre = {
	genreId: string;
	name: string;
};

export type Playlist = {
	playlistId: string;
	name: string;
	tracks?: Track[];
};
