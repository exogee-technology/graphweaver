import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { CredentialStorage } from '@exogee/graphweaver-auth';

@Entity()
export class Credential implements CredentialStorage {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	username!: string;

	@Property({ type: String })
	password!: string;
}
