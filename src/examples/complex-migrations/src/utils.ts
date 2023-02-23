import { logger } from '@exogee/logger';
import AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { Project } from 'ts-morph';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);

export const getConnectionInfo = async () => {
	logger.trace('Database::getConnectionInfo() - Enter');

	// We have some defaults
	const defaults = {
		host: 'localhost',
		port: 5432,
		dbName: 'graphweaver',
	};

	// If we've been passed a secret then we need to get all this
	// info from Secrets Manager.
	let secret = {};
	const secretArn = process.env.DATABASE_SECRET_ARN;

	if (secretArn) {
		const SecretsManager = new AWS.SecretsManager();
		logger.trace('Fetching database connection info from Secrets Manager');

		const result = await SecretsManager.getSecretValue({
			SecretId: secretArn,
		}).promise();

		logger.trace('Got result from Secrets Manager');

		if (result.SecretString) {
			logger.trace('Parsing result');

			// We only want certain properties from this secret.
			const {
				host,
				port,
				username: user,
				password,
				dbname: dbName,
			} = JSON.parse(result.SecretString) as {
				host: string;
				port: number;
				username: string;
				password: string;
				dbname: string;
			};

			secret = { host, port, user, password, dbName };
		}
	}

	// And finally we can override all of this with environment variables if needed.
	const environmentOverrides = {
		host: process.env.DATABASE_HOST,
		port: process.env.DATABASE_PORT ? parseInt(process.env.DATABASE_PORT) : undefined,
		user: process.env.DATABASE_USERNAME,
		password: process.env.DATABASE_PASSWORD,
		dbName: process.env.DATABASE_NAME,
	};

	// Create a function we can use to filter out undefined values in the object.
	const filterUndefined = (obj?: any) => {
		if (!obj) return {};

		for (const key of Object.keys(obj)) {
			if (obj[key] === undefined) delete obj[key];
		}

		return obj;
	};

	// Apply each in order so the correct value wins.
	return {
		...defaults,
		...filterUndefined(secret),
		...filterUndefined(environmentOverrides),
	};
};

export const writeIndex = async () => {
	// Update the index.ts file in the migrations directory.
	const files = await readdir(path.join('src', 'migrations'));
	const filteredFiles = files.filter((file) => file !== 'index.ts' && file !== '.DS_Store');

	const project = new Project();

	const index = project.createSourceFile(
		path.join('src', 'migrations', 'index.ts'),
		(writer) => {
			for (const file of filteredFiles) {
				writer.writeLine(`export * from './${path.basename(file, path.extname(file))}';`);
			}
		},
		{ overwrite: true }
	);

	await index.save();
};

export const connectToDatabase = async () => {
	logger.trace('connectToDatabase - enter');
	const connectionInfo = await getConnectionInfo();

	const client = new Client({
		user: connectionInfo.user,
		host: connectionInfo.host,
		database: connectionInfo.dbName,
		password: connectionInfo.password,
		port: connectionInfo.port,
	});
	await client.connect();

	logger.trace('Successfully connected.');

	return client;
};
