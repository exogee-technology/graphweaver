import { Entity, Field } from '../decorators';

@Entity('AdminUiEntityAttributeMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiEntityAttributeMetadata {
	@Field(() => Boolean, { nullable: true })
	isReadOnly?: boolean;

	@Field(() => Number, { nullable: true })
	exportPageSize?: number;
}
