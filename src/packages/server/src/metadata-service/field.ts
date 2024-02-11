import { Field, ObjectType } from 'type-graphql';
import { AdminUiFilterMetadata } from './filter';
import { AdminUiFieldAttributeMetadata } from './field-attribute';
import { AdminUiFieldExtentionsMetadata } from './field-extensions';
@ObjectType('AdminUiFieldMetadata')
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

	@Field(() => AdminUiFieldExtentionsMetadata, { nullable: true })
	extensions?: AdminUiFieldExtentionsMetadata;

	@Field(() => Boolean, { nullable: true })
	isArray?: boolean;
}
