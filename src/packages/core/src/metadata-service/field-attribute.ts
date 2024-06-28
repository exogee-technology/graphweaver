import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { shareable: true },
})
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean)
	isReadOnly!: boolean;

	@Field(() => Boolean)
	isRequired!: boolean;
}
