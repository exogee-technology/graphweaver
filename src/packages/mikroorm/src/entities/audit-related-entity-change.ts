import { BigIntType, Entity, Ref, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';

import type { AuditChange } from './audit-change';
import { AuditChange as AuditChangeValue } from './audit-change';
@Entity()
@Index({ properties: ['relatedEntityType', 'relatedEntityId'] })
export class AuditRelatedEntityChange {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@ManyToOne(() => AuditChangeValue, { deleteRule: 'cascade', ref: true })
	change!: Ref<AuditChange>;

	@Property({ type: 'string' })
	relatedEntityType!: string;

	@Property({ type: 'string' })
	relatedEntityId!: string;
}