import { Entity, Field } from '@exogee/graphweaver';

@Entity('AdminUiFieldAttributeMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean)
	isReadOnly!: boolean;

	@Field(() => Boolean)
	isRequired!: boolean;
}
