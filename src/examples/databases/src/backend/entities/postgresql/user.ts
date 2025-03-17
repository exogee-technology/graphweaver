import { BigIntType, Enum, Entity, PrimaryKey, Property } from '@mikro-orm/core';

export enum UserStatus {
	ACTIVE = 'active',
	BLOCKED = 'blocked',
	SUSPENDED = 'suspended',
}

@Entity()
export class User {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	username!: string;

	@Property({ type: String })
	email!: string;

	@Enum({
		fieldName: 'status',
		type: 'string',
		items: () => UserStatus,
		default: 'active',
	})
	status?: UserStatus = UserStatus.ACTIVE;

	@Property({ type: String, nullable: true })
	notes!: string;
}
