import { describe, expect, it } from 'vitest';
import { defineConnection } from '@exogee/graphweaver-sql';
import { mssql } from '../driver';

const host = process.env.MSSQL_HOST;

/** See the Postgres equivalent for why this matters. tarn honours both halves. */
const describeWithServer = host ? describe : describe.skip;

describeWithServer('sql server pool sizing (set MSSQL_HOST to run)', () => {
	const connect = (options: Parameters<typeof mssql>[0]) =>
		defineConnection({
			id: `pool-${Math.random()}`,
			dialect: mssql({
				host: host!,
				port: Number(process.env.MSSQL_PORT ?? 1433),
				user: process.env.MSSQL_USER ?? 'sa',
				password: process.env.MSSQL_PASSWORD,
				database: process.env.MSSQL_DATABASE ?? 'graphweaver_sql_test',
				encrypt: false,
				trustServerCertificate: true,
				...options,
			}),
		});

	const sessionsUsedBy = async (connection: ReturnType<typeof connect>) => {
		await connection.connect();

		try {
			const results = await Promise.all(
				Array.from({ length: 5 }, () =>
					connection.query<{ spid: number }>({
						text: "WAITFOR DELAY '00:00:00.050'; SELECT @@SPID AS spid",
						params: [],
					})
				)
			);

			return new Set(results.map((result) => Number(result.rows[0].spid)));
		} finally {
			await connection.close();
		}
	};

	it('holds one connection open when asked for one', async () => {
		expect((await sessionsUsedBy(connect({ pool: { min: 1, max: 1 } }))).size).toBe(1);
	});

	it('opens more than one when it is allowed to', async () => {
		expect((await sessionsUsedBy(connect({ pool: { max: 5 } }))).size).toBeGreaterThan(1);
	});
});
