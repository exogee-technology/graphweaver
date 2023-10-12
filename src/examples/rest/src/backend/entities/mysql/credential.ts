import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { PasswordStorage } from '@exogee/graphweaver-auth';

@Entity()
export class Credential extends BaseEntity implements PasswordStorage {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	username!: string;

	@Property({ type: String })
	password!: string;
}
