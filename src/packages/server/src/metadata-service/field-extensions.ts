import { Field, ObjectType } from 'type-graphql';

@ObjectType('AdminUiFieldExtentionsMetadata')
export class AdminUiFieldExtentionsMetadata {
	@Field(() => String, { nullable: true })
	key?: string;
}
