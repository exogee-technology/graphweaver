import { Field, ObjectType } from 'type-graphql';

@ObjectType('AdminUiEnumValueMetadata')
export class AdminUiEnumValueMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	value!: string;
}
