import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean)
	isReadOnly!: boolean;

	@Field(() => Boolean)
	isRequired!: boolean;
}
