import { Field, ObjectType } from 'type-graphql';

@ObjectType('AdminUiFieldExtensionsMetadata')
export class AdminUiFieldExtensionsMetadata {
	@Field(() => String, { nullable: true })
	key?: string;
}
