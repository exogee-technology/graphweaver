import { describe, expect, it, vi } from 'vitest';
import { logger } from '@exogee/logger';
import { defineConnection } from '@exogee/graphweaver-sql';
import { sqlite } from '../driver';

/**
 * SQLite has no pool to size -- one synchronous in-process handle, always. It accepts the option so
 * that a project can write the same line on every connection, and says something when the number
 * asked for cannot be delivered.
 */
describe('sqlite pool sizing', () => {
	const connect = (options: Parameters<typeof sqlite>[0]) =>
		defineConnection({ id: `pool-${Math.random()}`, dialect: sqlite(options) });

	it('takes the Lambda setting without complaint, because it is already true', async () => {
		const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
		const connection = connect({ pool: { min: 1, max: 1 } });

		await connection.connect();
		await connection.close();

		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	it('says so rather than silently ignoring a bigger pool', async () => {
		const warn = vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
		const connection = connect({ pool: { max: 10 } });

		await connection.connect();
		await connection.close();

		expect(warn).toHaveBeenCalledWith(expect.stringContaining('pool.max of 10'));
		warn.mockRestore();
	});
});
