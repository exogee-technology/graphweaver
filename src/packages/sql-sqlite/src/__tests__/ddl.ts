/** The SQLite form of the shared conformance schema. Only the DDL differs between dialects. */
export const ddl = [
	`CREATE TABLE artist (artist_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`,
	`CREATE TABLE album (
		album_id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		artist_id INTEGER REFERENCES artist(artist_id)
	)`,
	`CREATE TABLE track (
		track_id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		album_id INTEGER REFERENCES album(album_id),
		milliseconds INTEGER
	)`,
	`CREATE TABLE genre (genre_id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL)`,
	`CREATE TABLE track_genre (
		track_id INTEGER NOT NULL REFERENCES track(track_id),
		genre_id INTEGER NOT NULL REFERENCES genre(genre_id),
		PRIMARY KEY (track_id, genre_id)
	)`,
	`CREATE TABLE app_user (
		id TEXT PRIMARY KEY,
		username TEXT NOT NULL,
		password_hash TEXT NOT NULL,
		tenant_id TEXT NOT NULL,
		roles TEXT,
		preferences TEXT
	)`,
];
