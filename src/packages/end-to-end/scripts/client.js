/* eslint-disable @typescript-eslint/no-var-requires */
const { Client } = require('pg');

const pgclient = new Client({
	host: process.env.POSTGRES_HOST, // Use the environment variable for the hostname
	port: process.env.POSTGRES_PORT,
	user: 'postgres',
	password: 'postgres',
	database: 'gw', // Use the correct database name here
});

async function connectAndQuery() {
	try {
		await pgclient.connect();
		console.log('Connected to PostgreSQL');

		const table =
			'CREATE TABLE student(id SERIAL PRIMARY KEY, firstName VARCHAR(40) NOT NULL, lastName VARCHAR(40) NOT NULL, age INT, address VARCHAR(80), email VARCHAR(40))';
		const text =
			'INSERT INTO student(firstname, lastname, age, address, email) VALUES($1, $2, $3, $4, $5) RETURNING *';
		const values = [
			'Mona the',
			'Octocat',
			9,
			'88 Colin P Kelly Jr St, San Francisco, CA 94107, United States',
			'octocat@github.com',
		];

		await pgclient.query(table);
		const result = await pgclient.query(text, values);
		console.log('Inserted data:', result.rows[0]);

		const queryResult = await pgclient.query('SELECT * FROM student');
		console.log('Data in student table:', queryResult.rows);

		await pgclient.end();
		console.log('Connection closed');
	} catch (error) {
		console.error('Error:', error);
		process.exit(1); // Exit with a non-zero code to indicate an error occurred
	}
}

await connectAndQuery();
