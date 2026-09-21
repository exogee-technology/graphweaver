/* eslint-disable @typescript-eslint/no-require-imports */
const sql = require('mssql');
const fs = require('fs');

const SEED_FILE = './databases/mssql.sql';

const DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? 'sa';
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_PORT = Number.parseInt(process.env.DATABASE_PORT ?? '1433');

const connection = {
	server: DATABASE_HOST,
	port: DATABASE_PORT,
	user: DATABASE_USERNAME,
	password: DATABASE_PASSWORD,
	// The container generates a self signed certificate, and this only ever talks to a service
	// container in CI or a local container in development.
	options: { encrypt: false, trustServerCertificate: true },
	// One connection, deliberately. The Chinook script opens with `USE [Chinook]` in its own
	// batch, and that only applies to the connection it ran on -- so a pool would run the
	// following batches against master and create every table in the wrong database.
	pool: { min: 1, max: 1 },
};

async function seedData() {
	const script = fs.readFileSync(SEED_FILE).toString();

	try {
		// Connect without a database: the Chinook script creates and selects Chinook itself.
		const pool = await sql.connect({ ...connection, database: 'master' });

		// GO is a SQLCMD batch separator rather than T-SQL, so the driver never sees it and we
		// have to split on it ourselves. The Chinook script relies on it heavily.
		for (const batch of script.split(/^[^\S\r\n]*GO[^\S\r\n]*$/gim)) {
			if (batch.trim()) await pool.request().batch(batch);
		}

		await pool.close();
	} catch (error) {
		console.error('Error:', error);
		process.exit(1);
	}

	console.log('Database Seeded Successfully!');
	process.exit(0);
}

void seedData();
