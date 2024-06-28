import { Entity, PrimaryKey, Property, JsonType, BigIntType } from '@mikro-orm/core';
import { TraceData } from '@exogee/graphweaver';

@Entity({ tableName: 'Trace' })
export class Trace implements TraceData {
	@PrimaryKey({ fieldName: 'Id', type: new BigIntType('string') })
	id!: string;

	@Property({ fieldName: 'SpanId', type: String })
	spanId!: string;

	@Property({ fieldName: 'TraceId', type: String })
	traceId!: string;

	@Property({ fieldName: 'ParentId', type: String })
	parentId!: string;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(200)' })
	name!: string;

	@Property({ fieldName: 'Timestamp', type: new BigIntType('bigint') })
	timestamp!: bigint;

	@Property({ fieldName: 'Duration', type: new BigIntType('bigint') })
	duration!: bigint;

	@Property({ fieldName: 'Attributes', type: JsonType })
	attributes!: Record<string, unknown>;
}
