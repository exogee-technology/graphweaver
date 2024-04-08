/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const fs = require('fs');

const sql = fs.readFileSync('./databases/postgres.sql').toString();

const DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DATABASE_USERNAME = process.env.DATABASE_USERNAME;
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
const DATABASE_PORT = process.env.DATABASE_PORT ?? 5432;
const DATABASE_NAME = process.env.DATABASE_NAME ?? 'gw';
const DATABASE_RESEED = process.env.DATABASE_RESEED ?? '';

async function seedData() {
	if (DATABASE_RESEED === 'true') {
		console.error('Dropping database before seeding');
		try {
			const client = new Client({
				host: DATABASE_HOST,
				port: DATABASE_PORT,
				user: DATABASE_USERNAME,
				password: DATABASE_PASSWORD,
				database: 'postgres',
			});

			await client.connect();
			await client.query(`DROP DATABASE IF EXISTS ${DATABASE_NAME};`);
			await client.query(`CREATE DATABASE ${DATABASE_NAME};`);
			await client.end();
		} catch (error) {
			console.error('Error:', error);
			process.exit(1); // Exit with a non-zero code to indicate an error occurred
		}
		console.error('Database drop complete.');
	}

	try {
		const client = new Client({
			host: DATABASE_HOST,
			port: DATABASE_PORT,
			user: DATABASE_USERNAME,
			password: DATABASE_PASSWORD,
			database: DATABASE_NAME,
		});

		await client.connect();
		await client.query(sql);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1); // Exit with a non-zero code to indicate an error occurred
	}

	console.log('Database Seeded Successfully!');
	process.exit(0);
}

seedData();
