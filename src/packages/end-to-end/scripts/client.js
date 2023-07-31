/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');

const noDBClient = new Client({
	host: process.env.DATABASE_HOST,
	port: process.env.DATABASE_PORT,
	user: process.env.DATABASE_USERNAME,
	password: process.env.DATABASE_PASSWORD,
});

async function createdb() {
	try {
		await noDBClient.connect();
		const database = `create database gw;`;

		await noDBClient.query(database);
	} catch (error) {
		console.error('Error:', error);
		process.exit(1); // Exit with a non-zero code to indicate an error occurred
	} finally {
		//await noDBClient.end();
		console.log('Connection closed');
	}
}

createdb();
