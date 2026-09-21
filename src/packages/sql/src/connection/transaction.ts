import { AsyncLocalStorage } from 'node:async_hooks';
import { IsolationLevel, ISOLATION_RANK } from '../dialect/dialect';
import type { DriverConnection, SqlDriver } from './driver';

interface TransactionStore {
	connection: DriverConnection;
	isolationLevel: IsolationLevel;
}

const storage = new AsyncLocalStorage<TransactionStore>();

/** The pinned connection for the current async chain, if we are inside a transaction. */
export const currentTransaction = () => storage.getStore();

/**
 * Runs `callback` inside a transaction.
 *
 * Nesting merges rather than opening a savepoint, matching the existing MikroORM behaviour: core
 * wraps whole mutations in `withTransaction` and the provider's own write methods then ask for one
 * again, so merging is what keeps that to a single transaction.
 *
 * Asking for a *stricter* level than the one already running throws, because silently running at a
 * weaker level than the caller asked for is the kind of thing nobody notices until it corrupts
 * something.
 */
export const runInTransaction = async <T>(
	driver: SqlDriver,
	isolationLevel: IsolationLevel,
	callback: () => Promise<T>
): Promise<T> => {
	const existing = storage.getStore();

	if (existing) {
		if (ISOLATION_RANK[isolationLevel] > ISOLATION_RANK[existing.isolationLevel]) {
			throw new Error(
				`Cannot start a ${isolationLevel} transaction inside a ${existing.isolationLevel} one. ` +
					`The outer transaction would not provide the guarantees the inner one is asking for.`
			);
		}

		return callback();
	}

	const connection = await driver.acquire();

	try {
		for (const statement of driver.dialect.beginStatements(isolationLevel)) {
			await connection.query({ text: statement, params: [] });
		}

		const result = await storage.run({ connection, isolationLevel }, callback);

		await connection.query({ text: 'COMMIT', params: [] });
		return result;
	} catch (error) {
		try {
			await connection.query({ text: 'ROLLBACK', params: [] });
		} catch {
			// The original error is the interesting one; a rollback failure on an already broken
			// connection would only bury it.
		}
		throw error;
	} finally {
		await connection.release();
	}
};
