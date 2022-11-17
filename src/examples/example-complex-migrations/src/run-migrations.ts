import { logger } from '@exogee/logger';
import { Client } from 'pg';

import { Migration } from './migration';
import * as Migrations from './migrations';
import { connectToDatabase } from './utils';

export const runMigrations = async () => {
	logger.trace('runMigrations - enter');
	const database = await connectToDatabase();

	logger.trace('Connected! Sorting migrations.');

	const migrations = Object.values(Migrations).map((instance) => new instance()) as Migration[];
	migrations.sort((left, right) => left.sortKey - right.sortKey);

	logger.info(`${migrations.length} migration(s) present.`);

	// Let's check if there is a migration with a repeated key. This is probably an error (an easy mistake to make)
	const indexOfRepeatedSortKey = migrations.findIndex(
		(migration, index) => index > 0 && migrations[index - 1].sortKey === migration.sortKey
	);
	if (indexOfRepeatedSortKey !== -1) {
		const error = new Error(
			`sortKey number ${migrations[indexOfRepeatedSortKey].sortKey} is repeated. When creating new migration scripts make sure to update their sortKey`
		);
		logger.error(error);
		throw error;
	}

	try {
		logger.trace('Starting transaction');
		await database.query('BEGIN');

		// Find last run.
		const lastMigration = await getLastMigrationVersion(database);

		logger.info(`Last migration sort key is ${lastMigration}`);

		const filteredMigrations = migrations.filter((migration) => migration.sortKey > lastMigration);
		logger.info(`Running ${filteredMigrations.length} migration(s)`);

		for (const migration of filteredMigrations) {
			logger.trace(`Running migration with sortKey ${migration.sortKey}`);

			try {
				await migration.up(database);
			} catch (error) {
				logger.error(`Error while running migration with sortKey ${migration.sortKey}.`);
				throw error;
			}
		}

		logger.info(`Successfully ran ${filteredMigrations.length} migration(s).`);

		if (filteredMigrations.length) {
			logger.trace('Updating migrations table.');
			await setLastMigrationVersion(database, migrations[migrations.length - 1].sortKey);
		}

		logger.trace('Committing transaction');
		await database.query('COMMIT');
	} catch (error) {
		logger.error(error);
		await database.query('ROLLBACK');

		logger.trace('Closing connection');
		await database.end();

		throw error;
	}

	logger.trace('Closing connection');
	await database.end();

	logger.trace('Success');
};

const getLastMigrationVersion = async (database: Client) => {
	await database.query(`
		CREATE TABLE IF NOT EXISTS migration (
			"id" serial primary key,
			"last_migration" int4 not null,
			"run_at" timestamptz(0) not null
		)
	`);

	const result = await database.query(`
		SELECT last_migration
		FROM migration
		ORDER BY last_migration DESC
		LIMIT 1
	`);

	if (result.rowCount < 1) return -1;

	return result.rows[0].last_migration as number;
};

const setLastMigrationVersion = async (database: Client, version: number) => {
	logger.trace(`Setting migration version to ${version}`);

	await database.query(`DELETE FROM migration`);
	await database.query(
		`
		INSERT INTO migration (last_migration, run_at)
		VALUES ($1, NOW())
	`,
		[version]
	);
};
