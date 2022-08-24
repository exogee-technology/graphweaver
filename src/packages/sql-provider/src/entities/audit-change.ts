import {
	BigIntType,
	ChangeSetType,
	Collection,
	Entity,
	Enum,
	Index,
	OneToMany,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';

import { AuditRelatedEntityChange } from './audit-related-entity-change';
import { BaseEntity } from './base-entity';

@Entity()
@Index({ properties: ['entityType', 'entityId'] })
export class AuditChange extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@Enum({ items: () => ChangeSetType, type: 'string' })
	type!: ChangeSetType;

	@Property({ type: 'string' })
	entityId!: string;

	@Property({ type: 'string' })
	entityType!: string;

	@Property({ type: 'string' })
	createdBy!: string;

	@Property({ type: 'date' })
	createdAt: Date = new Date();

	@Property({ type: 'json', nullable: true })
	data?: Record<string, unknown>;

	@OneToMany(() => AuditRelatedEntityChange, 'change')
	relatedEntityChanges?: Collection<AuditRelatedEntityChange>;
}
