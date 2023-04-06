import { Field, ObjectType } from 'type-graphql';
import { AdminUiFilterMetadata } from './filter';

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
}
