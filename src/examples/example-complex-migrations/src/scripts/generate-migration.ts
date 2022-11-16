import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({
	path: path.join(__dirname, '..', '..', '..', 'graphql-api', '.env'),
});

import { Database } from '@exogee/graphweaver-mikroorm';
import { logger } from '@exogee/logger';
import { CodeBlockWriter, Project } from 'ts-morph';

import * as Migrations from '../migrations';
import { writeIndex } from '../utils';

const generateAndSave = async (diff: string[], sortKey: number, name: string) => {
	const fileName = `${sortKey.toString().padStart(3, '0')}-${name}.ts`;
	const project = new Project();

	const createStatement = (writer: CodeBlockWriter, sql: string) => {
		if (sql) {
			writer.writeLine(`await database.query(\`${sql}\`);`);
		} else {
			writer.blankLine();
		}
	};

	const migration = project.createSourceFile(path.join('src', 'migrations', fileName), (writer) => {
		writer.writeLine(`import { Client } from 'pg';`);
		writer.writeLine(`import { Migration } from '../migration';`);
		writer.blankLine();
		writer.write(`export class ${name} implements Migration`);
		writer.block(() => {
			writer.write(`sortKey = ${sortKey};`);
			writer.blankLine();
			writer.write('public async up(database: Client): Promise<any>');
			writer.block(() => diff.forEach((sql) => createStatement(writer, sql)));
			writer.blankLine();
		});
		writer.write('');
	});

	await migration.save();
};

const run = async () => {
	// Did they pass a name?
	const migrationName = process.argv[2];
	if (!migrationName) throw new Error('No migration name passed');

	logger.info('Creating migration %s', migrationName);

	// Validate existing migrations
	const sortKeys = new Set();
	const migrationInstances = Object.values(Migrations).map((Instance: any) => new Instance());

	for (const migration of migrationInstances) {
		if (sortKeys.has(migration.sortKey)) {
			throw new Error(`Duplicate sort key: ${migration.sortKey}`);
		}

		sortKeys.add(migration.sortKey);
	}

	// Ok, sort and find the max sort key
	migrationInstances.sort((left, right) => left.sortKey - right.sortKey);

	let maxSortKey = -1;

	if (migrationInstances.length) {
		maxSortKey = migrationInstances[migrationInstances.length - 1].sortKey;
	}

	// Ok, generate the SQL and save it.
	logger.info('Generating diff');
	await Database.connect();
	const generator = Database.orm.getSchemaGenerator();
	const dump = await generator.getUpdateSchemaSQL({ wrap: false });
	const lines = dump.split('\n').filter((line) => line.length > 0);

	logger.info('Saving...');
	await generateAndSave(lines, maxSortKey + 1, migrationName);

	logger.info('Updating index.ts');
	await writeIndex();
};

run()
	.catch((error) => {
		throw error;
	})
	.then(() => {
		logger.info('Done!');

		process.exit(0);
	});
