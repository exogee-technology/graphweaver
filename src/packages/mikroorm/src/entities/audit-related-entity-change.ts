import {
	BigIntType,
	Entity,
	IdentifiedReference,
	Index,
	ManyToOne,
	PrimaryKey,
	Property,
} from '@mikro-orm/core';

import { AuditChange } from './audit-change';
import { BaseEntity } from './base-entity';
@Entity()
@Index({ properties: ['relatedEntityType', 'relatedEntityId'] })
export class AuditRelatedEntityChange extends BaseEntity {
	@PrimaryKey({ type: BigIntType })
	id!: string;

	@ManyToOne(() => AuditChange, { onDelete: 'cascade', wrappedReference: true })
	change!: IdentifiedReference<AuditChange>;

	@Property({ type: 'string' })
	relatedEntityType!: string;

	@Property({ type: 'string' })
	relatedEntityId!: string;
}
