/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');
const fs = require('fs');

const sql = fs.readFileSync('./databases/postgres.sql').toString();

const DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
const DATABASE_USERNAME = process.env.DATABASE_USERNAME ?? 'postgres';
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? 'postgres';
const DATABASE_PORT = process.env.DATABASE_PORT ?? 5432;
const DATABASE_NAME = process.env.DATABASE_NAME ?? 'gw';

export async function seedData() {
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
		await client.end();
		console.log('Database Seeded Successfully!');
	} catch (error) {
		console.error('Error:', error);
	}
}

export async function dropDataAndRecreateGWDatabase() {
	try {
		const client = new Client({
			host: DATABASE_HOST,
			port: DATABASE_PORT,
			user: DATABASE_USERNAME,
			password: DATABASE_PASSWORD,
			database: 'postgres', // Connect to the default 'postgres' database instead of 'gw'
		});

		await client.connect();

		// Drop the 'gw' database
		await client.query('DROP DATABASE IF EXISTS gw');

		// Close the client connection
		await client.end();

		// Create a new client instance to reconnect to the default 'postgres' database
		const createDbClient = new Client({
			host: DATABASE_HOST,
			port: DATABASE_PORT,
			user: DATABASE_USERNAME,
			password: DATABASE_PASSWORD,
			database: 'postgres', // Connect to the default 'postgres' database
		});
		await createDbClient.connect();

		// Create the 'gw' database
		await createDbClient.query('CREATE DATABASE gw');

		// Close the client connection to the 'postgres' database
		await createDbClient.end();

		console.log('Database Dropped and Re-Created Successfully!');
	} catch (error) {
		console.error('Error while dropping and recreating database:', error);
	}
}

export async function deleteDatabase() {
	try {
		const client = new Client({
			host: DATABASE_HOST,
			port: DATABASE_PORT,
			user: DATABASE_USERNAME,
			password: DATABASE_PASSWORD,
			database: 'postgres', // Connect to the default 'postgres' database instead of 'gw'
		});

		await client.connect();

		// Drop the 'gw' database
		await client.query('DROP DATABASE IF EXISTS gw');

		// Close the client connection to the 'postgres' database
		await client.end();

		console.log('Database Deleted Successfully!');
	} catch (error) {
		console.error('Error:', error);
	}
}
