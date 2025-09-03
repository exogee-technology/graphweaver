import { BigIntType, Entity, Index, ManyToOne, PrimaryKey, Property } from '@mikro-orm/core';
import type { Ref } from '@mikro-orm/core';
import { AuditChange } from './audit-change';
@Entity()
@Index({ properties: ['relatedEntityType', 'relatedEntityId'] })
export class AuditRelatedEntityChange {
	@PrimaryKey({ type: new BigIntType('string') })
	id!: string;

	@ManyToOne(() => AuditChange, { deleteRule: 'cascade', ref: true })
	change!: Ref<AuditChange>;

	@Property({ type: 'string' })
	relatedEntityType!: string;

	@Property({ type: 'string' })
	relatedEntityId!: string;
}
