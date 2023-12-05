import { Field, ObjectType } from 'type-graphql';
import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityAttributeMetadata } from './entity-attribute';

@ObjectType('AdminUiEntityMetadata')
export class AdminUiEntityMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String, { nullable: true })
	backendId?: string | null;

	@Field(() => String, { nullable: true })
	summaryField?: string | null;

	@Field(() => [AdminUiFieldMetadata])
	fields?: AdminUiFieldMetadata[] = [];

	@Field(() => AdminUiEntityAttributeMetadata)
	attributes?: AdminUiEntityAttributeMetadata;
}
