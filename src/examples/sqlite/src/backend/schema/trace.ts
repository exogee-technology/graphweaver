import { Trace } from '@exogee/graphweaver';
import { SqlDataProvider } from '@exogee/graphweaver-sql';

import { traceConnection } from '../database';

/**
 * Where OpenTelemetry spans are written.
 *
 * `Trace` is declared by the core package, which registers it and attaches this provider to it when
 * tracing is switched on. So there is deliberately no `@Entity` here: a second entity by that name
 * fails schema building with "duplicate entity name (Trace)".
 *
 * That leaves nowhere to hang the storage mapping, which is what the provider's `columns` option is
 * for -- the escape hatch for an entity you do not own and therefore cannot decorate. This table's
 * columns are PascalCase, which the naming strategy would otherwise turn into snake_case.
 */
export const traceProvider = new SqlDataProvider(() => Trace, traceConnection, {
	table: 'Trace',
	columns: {
		id: 'Id',
		spanId: 'SpanId',
		traceId: 'TraceId',
		parentId: 'ParentId',
		name: 'Name',
		timestamp: { column: 'Timestamp', type: 'bigint' },
		duration: { column: 'Duration', type: 'bigint' },
		attributes: { column: 'Attributes', type: 'json' },
	},
});
