import { Field, ObjectType } from 'type-graphql';

@ObjectType('AdminUiFieldAttributeMetadata')
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean, { nullable: true })
	isReadOnly?: boolean;
}
