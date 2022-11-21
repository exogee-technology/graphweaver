import { BigIntType, Entity, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { User } from './user';

@Entity()
export class UserDog extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	dogId!: string;

	@ManyToOne(() => User)
	user!: User;
}
