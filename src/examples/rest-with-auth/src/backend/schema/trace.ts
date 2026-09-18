import { Trace } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';
import { SqlDataProvider } from '@exogee/graphweaver-sql';

import { myConnection } from '../database';

/**
 * Where OpenTelemetry spans are stored.
 *
 * Trace is declared by the core package, so the storage mapping goes on the provider rather than
 * on the class. Its column names are camelCase in the database, which the naming strategy would
 * otherwise turn into snake_case.
 */
export const traceProvider = new SqlDataProvider(() => Trace, myConnection, {
	table: 'trace',
	columns: {
		spanId: 'spanId',
		parentId: 'parentId',
		traceId: 'traceId',
		timestamp: { column: 'timestamp', type: 'bigint' },
		duration: { column: 'duration', type: 'bigint' },
		attributes: { column: 'attributes', type: 'json' },
	},
});

ApplyAccessControlList({
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
})(Trace);
