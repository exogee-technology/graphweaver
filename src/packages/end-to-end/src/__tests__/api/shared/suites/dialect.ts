import { after, before, beforeEach } from 'node:test';
import { resetDatabase } from '../../../../utils';

/**
 * What a dialect's suite needs to know about the database underneath it.
 *
 * Every dialect runs the same Chinook schema and the same GraphQL documents, so the only things
 * that legitimately vary are how the seed behaves and how expensive it is to put back.
 */
export interface DialectOptions {
	/**
	 * Whether the seed's primary keys are database-generated.
	 *
	 * Only the SQLite Chinook seed declares AUTOINCREMENT; the Postgres, MySQL and SQL Server
	 * scripts all insert explicit ids, so the importer marks those entities
	 * `clientGeneratedPrimaryKeys: true` and the client has to supply one on every create.
	 */
	clientGeneratedPrimaryKeys: boolean;

	/**
	 * How often the database goes back to its seeded state.
	 *
	 * `each-test` is only affordable where a reset is a file copy. Everywhere else it is thousands
	 * of INSERTs, so those dialects reset once around the file and the tests have to tolerate the
	 * rows their neighbours left behind.
	 */
	reset: 'each-test' | 'once-per-file';

	/** Node's default hook timeout is 30s, which the larger seeds run close to. */
	resetTimeout?: number;
}

/**
 * Installs the reset hooks and hands back an id allocator.
 *
 * The allocator is the thing that makes one suite work in both modes. Chinook ends at artist 275,
 * album 347 and playlist 18, so the next free id is knowable -- but only until a test uses it. With
 * a reset between every test the counters go back to the start each time; without one they have to
 * keep climbing, or the second test would collide with the first test's rows.
 *
 * Either way the suite knows exactly which id a create will produce, so it can assert on it instead
 * of settling for "something came back".
 */
export const setupDialect = (
	options: DialectOptions,
	/**
	 * A suite that only reads still needs to start from the seeded row counts, but it cannot
	 * disturb them -- so it resets once on the way in and never on the way out, whatever the
	 * dialect's mutation suites do.
	 */
	kind: 'mutating' | 'read-only' = 'mutating'
) => {
	const hookOptions = options.resetTimeout ? { timeout: options.resetTimeout } : undefined;

	if (kind === 'read-only') {
		before(resetDatabase, hookOptions);
	} else if (options.reset === 'each-test') {
		beforeEach(resetDatabase, hookOptions);
	} else {
		before(resetDatabase, hookOptions);
		after(resetDatabase, hookOptions);
	}

	// One past the last row of each seeded table.
	const seedCeiling = { artist: 276, album: 348, playlist: 19 } as const;
	const next = { ...seedCeiling };

	if (kind === 'mutating' && options.reset === 'each-test') {
		beforeEach(() => {
			Object.assign(next, seedCeiling);
		});
	}

	return {
		clientGeneratedPrimaryKeys: options.clientGeneratedPrimaryKeys,

		/** The id the next created row of this type will have, consumed on the way out. */
		nextId: (table: keyof typeof seedCeiling) => String(next[table]++),

		/**
		 * The primary key to send in a create payload.
		 *
		 * An empty object where the database generates them: sending one there is not merely
		 * redundant, it is rejected, because the field is not on the create input at all.
		 */
		primaryKey: (field: string, id: string) =>
			options.clientGeneratedPrimaryKeys ? { [field]: id } : {},
	};
};

export type DialectSetup = ReturnType<typeof setupDialect>;
