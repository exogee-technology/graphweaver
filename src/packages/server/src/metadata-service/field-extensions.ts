import { Entity, Field } from '@exogee/graphweaver';

@Entity('AdminUiFieldExtensionsMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiFieldExtensionsMetadata {
	@Field(() => String, { nullable: true })
	key?: string;
}
