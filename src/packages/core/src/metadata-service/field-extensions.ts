import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldExtensionsMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiFieldExtensionsMetadata {
	@Field(() => String, { nullable: true })
	key?: string;
}
