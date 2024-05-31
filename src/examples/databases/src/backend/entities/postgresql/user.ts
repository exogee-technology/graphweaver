import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class User {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	username!: string;

	@Property({ type: String })
	email!: string;

	@Property({ type: Boolean })
	deleted!: boolean;
}
