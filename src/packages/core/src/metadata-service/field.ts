import { Entity, Field } from '../decorators';
import { AdminUiFilterMetadata } from './filter';
import { AdminUiFieldAttributeMetadata } from './field-attribute';
import { AdminUiFieldExtensionsMetadata } from './field-extensions';

@Entity('AdminUiFieldMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiFieldMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	type!: string;

	@Field(() => String, { nullable: true })
	relationshipType?: string;

	@Field(() => String, { nullable: true })
	relatedEntity?: string;

	@Field(() => AdminUiFilterMetadata, { nullable: true })
	filter?: AdminUiFilterMetadata;

	@Field(() => AdminUiFieldAttributeMetadata, { nullable: true })
	attributes?: AdminUiFieldAttributeMetadata;

	@Field(() => AdminUiFieldExtensionsMetadata, { nullable: true })
	extensions?: AdminUiFieldExtensionsMetadata;

	@Field(() => Boolean, { nullable: true })
	isArray?: boolean;
}
