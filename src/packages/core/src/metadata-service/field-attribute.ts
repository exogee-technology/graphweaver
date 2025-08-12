import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean)
	isReadOnly!: boolean;

	@Field(() => Boolean)
	isRequiredForCreate!: boolean;

	@Field(() => Boolean)
	isRequiredForUpdate!: boolean;
}
