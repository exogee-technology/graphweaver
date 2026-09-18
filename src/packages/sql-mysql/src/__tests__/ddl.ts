/** The MySQL form of the shared conformance schema. */
export const ddl = [
	`CREATE TABLE artist (
		artist_id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL
	)`,
	`CREATE TABLE album (
		album_id INT AUTO_INCREMENT PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		artist_id INT,
		FOREIGN KEY (artist_id) REFERENCES artist(artist_id)
	)`,
	`CREATE TABLE track (
		track_id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		album_id INT,
		milliseconds INT,
		FOREIGN KEY (album_id) REFERENCES album(album_id)
	)`,
	`CREATE TABLE genre (
		genre_id INT AUTO_INCREMENT PRIMARY KEY,
		name VARCHAR(255) NOT NULL
	)`,
	`CREATE TABLE track_genre (
		track_id INT NOT NULL,
		genre_id INT NOT NULL,
		PRIMARY KEY (track_id, genre_id),
		FOREIGN KEY (track_id) REFERENCES track(track_id),
		FOREIGN KEY (genre_id) REFERENCES genre(genre_id)
	)`,
	`CREATE TABLE app_user (
		id VARCHAR(64) PRIMARY KEY,
		username VARCHAR(255) NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		tenant_id VARCHAR(64) NOT NULL,
		roles TEXT,
		preferences JSON
	)`,
];

/** Move AUTO_INCREMENT past the explicit ids the seed inserted. */
export const afterSeed = ['artist', 'album', 'track', 'genre'].map(
	(table) => `ALTER TABLE ${table} AUTO_INCREMENT = 100`
);
