import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Submission {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: 'json', nullable: true })
	image?: { filename: string; type: string };
}
