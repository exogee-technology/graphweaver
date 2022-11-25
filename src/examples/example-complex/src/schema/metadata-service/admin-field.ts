import { Field, ObjectType } from 'type-graphql';

@ObjectType('AdminField')
export class AdminField {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	type!: string;

	@Field(() => String, { nullable: true })
	relationshipType?: string;

	@Field(() => String, { nullable: true })
	relatedEntity?: string;
}
