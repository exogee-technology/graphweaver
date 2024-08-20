import {
	BigIntType,
	Entity,
	PrimaryKey,
	Property,
	ManyToMany,
	Collection,
	Enum,
} from '@mikro-orm/core';
import { ExternalIdField } from '@exogee/graphweaver-mikroorm';

import { Tag } from './tag';

export enum Priority {
	HIGH = 'HIGH',
	MEDIUM = 'MEDIUM',
	LOW = 'LOW',
}

@Entity()
export class Task {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@Property({ type: String })
	description!: string;

	@Property({ type: Boolean, fieldName: 'completed' })
	isCompleted!: boolean;

	@ExternalIdField({ from: 'user' })
	@Property({ type: new BigIntType('string') })
	userId!: string;

	@ManyToMany(() => Tag, (tag) => tag.tasks, { owner: true })
	tags: Collection<Tag> = new Collection<Tag>(this);

	@Enum({ items: () => Priority, type: 'string' })
	priority?: string;
}
