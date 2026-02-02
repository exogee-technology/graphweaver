import { BigIntType, Collection, Entity, ManyToMany, ManyToOne, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Tag } from './tag';
import { User } from './user';

@Entity({ tableName: 'task' })
export class Task {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@ManyToOne({ entity: () => User, ref: true, nullable: true })
	user?: Ref<User>;

	@Property({ type: 'text', nullable: true })
	description?: string;

	@ManyToMany({ entity: () => Tag, pivotTable: 'task_tag', joinColumn: 'task_id', inverseJoinColumn: 'tag_id' })
	tags = new Collection<Tag>(this);
}
