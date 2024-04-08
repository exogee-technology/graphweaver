import { Entity, Field } from '@exogee/graphweaver';

@Entity('AdminUiEntityAttributeMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiEntityAttributeMetadata {
	@Field(() => Boolean, { nullable: true })
	isReadOnly?: boolean;

	@Field(() => Number, { nullable: true })
	exportPageSize?: number;
}
