import { Field, ObjectType } from 'type-graphql';
import { AdminUiEnumValueMetadata } from './enum-value';

@ObjectType('AdminUiEnumMetadata')
export class AdminUiEnumMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => [AdminUiEnumValueMetadata])
	values() {
		return [];
	}
}
