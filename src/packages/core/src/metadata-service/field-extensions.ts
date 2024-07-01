import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldExtensionsMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiFieldExtensionsMetadata {
	@Field(() => String, { nullable: true, directives: { inaccessible: true } })
	key?: string;
}
