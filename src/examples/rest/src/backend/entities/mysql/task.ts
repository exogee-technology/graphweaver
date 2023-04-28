import { BigIntType, Entity, PrimaryKey, Property, ManyToMany, Collection } from '@mikro-orm/core';
import { BaseEntity, ExternalIdField } from '@exogee/graphweaver-mikroorm';

import { Tag } from './tag';

@Entity()
export class Task extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	description!: string;

	@ExternalIdField({ from: 'people' })
	@Property({ type: BigIntType })
	personId!: string;

	@ManyToMany(() => Tag, (tag) => tag.tasks, { owner: true })
	tags = new Collection<Tag>(this);
}
