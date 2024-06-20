import { Entity, PrimaryKey, Property, JsonType } from '@mikro-orm/core';
import { TraceData } from '@exogee/graphweaver';

@Entity()
export class Trace implements TraceData {
	@PrimaryKey({ type: String })
	id!: string;

	@Property({ type: String })
	traceId!: string;

	@Property({ type: String })
	parentId!: string;

	@Property({ type: String })
	name!: string;

	@Property({ type: Date })
	timestamp!: Date;

	@Property({ type: Number })
	duration!: number;

	@Property({ type: JsonType })
	attributes!: Record<string, unknown>;
}
