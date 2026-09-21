import { describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { mysql } from '../driver';

const host = process.env.MYSQL_HOST;

/**
 * See the Postgres equivalent for why this matters. MySQL differs in one way worth stating: mysql2
 * has no minimum pool size, so `min` is accepted for symmetry and only `max` does anything.
 */
const describeWithServer = host ? describe : describe.skip;

describeWithServer('mysql pool sizing (set MYSQL_HOST to run)', () => {
	const connect = (options: Parameters<typeof mysql>[0]) =>
		defineConnection({
			id: `pool-${Math.random()}`,
			dialect: mysql({
				host: host!,
				port: Number(process.env.MYSQL_PORT ?? 3306),
				user: process.env.MYSQL_USER ?? 'root',
				password: process.env.MYSQL_PASSWORD,
				database: process.env.MYSQL_DATABASE ?? 'graphweaver_sql_test',
				...options,
			}),
		});

	const connectionsUsedBy = async (connection: ReturnType<typeof connect>) => {
		await connection.connect();

		try {
			const results = await Promise.all(
				Array.from({ length: 5 }, () =>
					connection.query<{ id: number }>({
						text: 'SELECT CONNECTION_ID() AS id, SLEEP(0.05)',
						params: [],
					})
				)
			);

			return new Set(results.map((result) => Number(result.rows[0].id)));
		} finally {
			await connection.close();
		}
	};

	it('holds one connection open when asked for one', async () => {
		expect((await connectionsUsedBy(connect({ pool: { min: 1, max: 1 } }))).size).toBe(1);
	});

	it("still understands mysql2's own spelling", async () => {
		expect((await connectionsUsedBy(connect({ connectionLimit: 1 }))).size).toBe(1);
	});

	it('opens more than one when it is allowed to', async () => {
		expect((await connectionsUsedBy(connect({ pool: { max: 5 } }))).size).toBeGreaterThan(1);
	});
});
