import { Trace } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';
import { SqlDataProvider } from '@exogee/graphweaver-sql';

import { myConnection } from '../database';

/**
 * Where OpenTelemetry spans are stored.
 *
 * Trace is declared by the core package, so the storage mapping goes on the provider rather than on
 * the class -- it is the escape hatch for an entity you do not own and therefore cannot decorate.
 *
 * Only the types need saying here. This table's columns are snake_case, which is exactly what the
 * default naming strategy produces, so naming them again would only be a chance to get one wrong.
 */
export const traceProvider = new SqlDataProvider(() => Trace, myConnection, {
	table: 'trace',
	columns: {
		// BIGINT and JSON, neither of which the GraphQL type says.
		timestamp: { type: 'bigint' },
		duration: { type: 'bigint' },
		attributes: { type: 'json' },
	},
});

ApplyAccessControlList({
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
})(Trace);
