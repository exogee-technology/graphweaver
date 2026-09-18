import { Entity, ID } from '@exogee/graphweaver';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import { Field, SqlDataProvider } from '@exogee/graphweaver-sql';
import { traceConnection } from '../database';

/**
 * Where OpenTelemetry spans are written.
 *
 * Excluded from the built-in operations because this is a sink, not part of the API -- the Admin
 * UI reads traces through its own metadata queries.
 */
export const traceProvider = new SqlDataProvider(() => Trace, traceConnection, {
	table: 'Trace',
});

@Entity<Trace>('Trace', {
	provider: traceProvider,
	apiOptions: { excludeFromBuiltInOperations: true, clientGeneratedPrimaryKeys: true },
})
export class Trace {
	@Field(() => ID, { column: 'Id', primaryKeyField: true })
	id!: string;

	@Field(() => String, { column: 'SpanId' })
	spanId!: string;

	@Field(() => String, { column: 'TraceId' })
	traceId!: string;

	@Field(() => String, { column: 'ParentId' })
	parentId!: string;

	@Field(() => String, { column: 'Name' })
	name!: string;

	@Field(() => String, { column: 'Timestamp', columnType: 'bigint' })
	timestamp!: string;

	@Field(() => String, { column: 'Duration', columnType: 'bigint' })
	duration!: string;

	@Field(() => GraphQLJSON, { column: 'Attributes', columnType: 'json' })
	attributes!: Record<string, unknown>;
}
