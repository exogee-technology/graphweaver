import { BigIntType, Entity, Ref, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';

import { AuditChange } from './audit-change';
import { BaseEntity } from './base-entity';
@Entity()
@Index({ properties: ['relatedEntityType', 'relatedEntityId'] })
export class AuditRelatedEntityChange extends BaseEntity {
	@PrimaryKey()
	id!: bigint;

	@ManyToOne(() => AuditChange, { deleteRule: 'cascade', ref: true })
	change!: Ref<AuditChange>;

	@Property({ type: 'string' })
	relatedEntityType!: string;

	@Property({ type: 'string' })
	relatedEntityId!: string;
}
