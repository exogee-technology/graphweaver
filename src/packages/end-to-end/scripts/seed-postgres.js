/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const fs = require('fs');

var sql = fs.readFileSync('./databases/postgres.sql').toString();

const DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? 'postgres';
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? 'postgres';
const DATABASE_PORT = process.env.DATABASE_PORT ?? 5432;
const DATABASE_NAME = process.env.DATABASE_NAME ?? 'gw';

async function seedData() {
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

	console.log('Connection closed');
	process.exit(0);
}

seedData();
