/** The SQL Server form of the shared conformance schema. */
export const ddl = [
	`CREATE TABLE artist (
		artist_id INT IDENTITY(1,1) PRIMARY KEY,
		name NVARCHAR(255) NOT NULL
	)`,
	`CREATE TABLE album (
		album_id INT IDENTITY(1,1) PRIMARY KEY,
		title NVARCHAR(255) NOT NULL,
		artist_id INT REFERENCES artist(artist_id)
	)`,
	`CREATE TABLE track (
		track_id INT IDENTITY(1,1) PRIMARY KEY,
		name NVARCHAR(255) NOT NULL,
		album_id INT REFERENCES album(album_id),
		milliseconds INT
	)`,
	`CREATE TABLE genre (
		genre_id INT IDENTITY(1,1) PRIMARY KEY,
		name NVARCHAR(255) NOT NULL
	)`,
	`CREATE TABLE track_genre (
		track_id INT NOT NULL REFERENCES track(track_id),
		genre_id INT NOT NULL REFERENCES genre(genre_id),
		PRIMARY KEY (track_id, genre_id)
	)`,
	`CREATE TABLE app_user (
		id NVARCHAR(64) PRIMARY KEY,
		username NVARCHAR(255) NOT NULL,
		password_hash NVARCHAR(255) NOT NULL,
		tenant_id NVARCHAR(64) NOT NULL,
		roles NVARCHAR(MAX),
		preferences NVARCHAR(MAX)
	)`,
];

/**
 * Brackets a seed INSERT with IDENTITY_INSERT.
 *
 * SQL Server will not accept an explicit value for an identity column otherwise, and the setting
 * is scoped to one table on one connection -- so it has to be in the same batch as the insert,
 * not set up beforehand. Only one table may have it on at a time, which is why this turns it off
 * again immediately.
 */
export const wrapSeed = (sql: string) => {
	const table = /INSERT INTO (\w+)/i.exec(sql)?.[1];
	if (!table || !IDENTITY_TABLES.has(table)) return sql;

	return `SET IDENTITY_INSERT ${table} ON; ${sql}; SET IDENTITY_INSERT ${table} OFF;`;
};

const IDENTITY_TABLES = new Set(['artist', 'album', 'track', 'genre']);
