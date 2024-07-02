import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean, { directives: { inaccessible: true } })
	isReadOnly!: boolean;

	@Field(() => Boolean, { directives: { inaccessible: true } })
	isRequired!: boolean;
}
