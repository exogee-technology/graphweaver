import { BigIntType, Collection, Entity, OneToMany, PrimaryKey, Property, Unique } from '@mikro-orm/core';
import { Task } from './task';

@Entity({ tableName: 'user' })
export class User {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Unique({ name: 'user_username_key' })
	@Property({ type: 'string', length: 255 })
	username!: string;

	@Unique({ name: 'user_email_key' })
	@Property({ type: 'string', length: 255 })
	email!: string;

	@OneToMany({ entity: () => Task, mappedBy: 'user' })
	tasks = new Collection<Task>(this);
}
