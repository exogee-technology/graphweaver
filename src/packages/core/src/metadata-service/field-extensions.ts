import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldExtensionsMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiFieldExtensionsMetadata {
	@Field(() => String, { nullable: true })
	key?: string;
}
