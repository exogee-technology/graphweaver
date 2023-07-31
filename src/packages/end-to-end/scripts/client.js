/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');

const noDBClient = new Client({
	host: process.env.POSTGRES_HOST, // Use the environment variable for the hostname
	port: process.env.POSTGRES_PORT,
	user: 'postgres',
	password: 'postgres',
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
