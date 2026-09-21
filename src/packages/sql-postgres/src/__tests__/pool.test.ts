import { describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { postgres } from '../driver';

const host = process.env.PGHOST;

/**
 * `pool: { min: 1, max: 1 }` is the setting a Lambda deployment needs: one connection per warm
 * container, because each handles one request at a time and a few hundred containers at the default
 * ten would exhaust a database long before the code did. It is also what the MikroORM configuration
 * spelled, so a migrating project moves the line across unchanged.
 *
 * Asserted by asking the server which backend answered rather than by reading our own config back,
 * because the thing that can silently go wrong is the option not reaching the driver at all.
 */
const describeWithServer = host ? describe : describe.skip;

describeWithServer('postgres pool sizing (set PGHOST to run)', () => {
	const connect = (options: Parameters<typeof postgres>[0]) =>
		defineConnection({
			id: `pool-${Math.random()}`,
			dialect: postgres({
				host: host!,
				port: Number(process.env.PGPORT ?? 5432),
				user: process.env.PGUSER ?? 'postgres',
				password: process.env.PGPASSWORD,
				database: process.env.PGDATABASE ?? 'graphweaver_sql_test',
				...options,
			}),
		});

	const backendsUsedBy = async (connection: ReturnType<typeof connect>) => {
		await connection.connect();

		try {
			// Concurrent on purpose: one at a time would reuse a single connection whatever the
			// pool size is, and prove nothing.
			const results = await Promise.all(
				Array.from({ length: 5 }, () =>
					connection.query<{ pid: number }>({
						text: 'SELECT pg_backend_pid() AS pid, pg_sleep(0.05)',
						params: [],
					})
				)
			);

			return new Set(results.map((result) => Number(result.rows[0].pid)));
		} finally {
			await connection.close();
		}
	};

	it('holds one connection open when asked for one', async () => {
		expect((await backendsUsedBy(connect({ pool: { min: 1, max: 1 } }))).size).toBe(1);
	});

	it("still understands pg's own spelling", async () => {
		expect((await backendsUsedBy(connect({ max: 1 }))).size).toBe(1);
	});

	it('opens more than one when it is allowed to', async () => {
		// The counterpart assertion: without it, a driver that ignored the option entirely and
		// always used one connection would pass the two tests above.
		expect((await backendsUsedBy(connect({ pool: { max: 5 } }))).size).toBeGreaterThan(1);
	});
});
