import {
	BigIntType,
	Entity,
	PrimaryKey,
	Property,
	ManyToMany,
	Collection,
	Enum,
} from '@mikro-orm/core';
import { BaseEntity, ExternalIdField } from '@exogee/graphweaver-mikroorm';

import { Tag } from './tag';

export enum Priority {
	HIGH = 'HIGH',
	MEDIUM = 'MEDIUM',
	LOW = 'LOW',
}

@Entity()
export class Task extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Property({ type: String })
	description!: string;

	@Property({ type: Boolean })
	completed!: boolean;

	@ExternalIdField({ from: 'user' })
	@Property({ type: BigIntType })
	userId!: string;

	@ManyToMany(() => Tag, (tag) => tag.tasks, { owner: true })
	tags: Collection<Tag> = new Collection<Tag>(this);

	@Enum({ items: () => Priority, type: 'string' })
	priority?: string;
}
