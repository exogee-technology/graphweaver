import { Entity, Field } from '../decorators';
import { AdminUiFilterMetadata } from './filter';
import { AdminUiFieldAttributeMetadata } from './field-attribute';
import { AdminUiFieldExtensionsMetadata } from './field-extensions';

@Entity('AdminUiFieldMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiFieldMetadata {
	@Field(() => String, { directives: { inaccessible: true } })
	name!: string;

	@Field(() => String, { directives: { inaccessible: true } })
	type!: string;

	@Field(() => String, { nullable: true, directives: { inaccessible: true } })
	relationshipType?: string;

	@Field(() => String, { nullable: true, directives: { inaccessible: true } })
	relatedEntity?: string;

	@Field(() => AdminUiFilterMetadata, { nullable: true, directives: { inaccessible: true } })
	filter?: AdminUiFilterMetadata;

	@Field(() => AdminUiFieldAttributeMetadata, {
		nullable: true,
		directives: { inaccessible: true },
	})
	attributes?: AdminUiFieldAttributeMetadata;

	@Field(() => AdminUiFieldExtensionsMetadata, {
		nullable: true,
		directives: { inaccessible: true },
	})
	extensions?: AdminUiFieldExtensionsMetadata;

	@Field(() => Boolean, { nullable: true, directives: { inaccessible: true } })
	isArray?: boolean;

	@Field(() => Boolean, { nullable: true })
	hideInTable?: boolean;

	@Field(() => Boolean, { nullable: true })
	hideInFilterBar?: boolean;

	@Field(() => Boolean, { nullable: true })
	hideInDetailForm?: boolean;
}
