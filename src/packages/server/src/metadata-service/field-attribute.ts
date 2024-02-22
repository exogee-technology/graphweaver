import { Field, ObjectType } from 'type-graphql';

@ObjectType('AdminUiFieldAttributeMetadata')
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean)
	isReadOnly!: boolean;

	@Field(() => Boolean)
	isRequired!: boolean;
}
