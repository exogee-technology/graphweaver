import { Entity, Index, JsonType, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from './base-entity';

@Entity()
export class Session extends BaseEntity {
	@PrimaryKey({ type: 'string' })
	sessionToken!: string;

	@Property({ type: 'date' })
	@Index()
	expiresAt!: Date;

	@Property({ type: JsonType, nullable: true })
	value?: any;
}
