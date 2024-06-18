import { BigIntType, Entity, PrimaryKey, Property, JsonType } from '@mikro-orm/core';

@Entity()
export class Trace {
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
	attributes!: Record<string, any>;
}
