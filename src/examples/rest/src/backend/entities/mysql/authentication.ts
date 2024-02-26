import { Entity, PrimaryKey, Property, JsonType, BigIntType } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import type { AuthenticationBaseEntity } from '@exogee/graphweaver-auth';

@Entity()
export class Authentication<T> extends BaseEntity implements AuthenticationBaseEntity<T> {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	type!: string;

	@Property({ type: new BigIntType('string') })
	userId!: string;

	@Property({ type: JsonType })
	data!: T;

	@Property({ type: Date })
	createdAt!: Date;
}
