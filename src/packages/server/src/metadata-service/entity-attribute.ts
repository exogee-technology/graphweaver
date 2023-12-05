import { Field, ObjectType } from 'type-graphql';

@ObjectType('AdminUiEntityAttributeMetadata')
export class AdminUiEntityAttributeMetadata {
	@Field(() => Boolean, { nullable: true })
	isReadOnly?: boolean;
}
