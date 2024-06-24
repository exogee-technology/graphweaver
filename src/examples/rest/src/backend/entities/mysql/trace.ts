import { Entity, PrimaryKey, Property, JsonType, BigIntType } from '@mikro-orm/core';
import { TraceData } from '@exogee/graphweaver';

@Entity()
export class Trace implements TraceData {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	spanId!: string;

	@Property({ type: String })
	traceId!: string;

	@Property({ type: String })
	parentId!: string;

	@Property({ type: String })
	name!: string;

	@Property({ type: new BigIntType('bigint') })
	timestamp!: bigint;

	@Property({ type: new BigIntType('bigint') })
	duration!: bigint;

	@Property({ type: JsonType })
	attributes!: Record<string, unknown>;
}
