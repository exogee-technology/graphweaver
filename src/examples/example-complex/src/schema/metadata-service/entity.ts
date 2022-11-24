import { GraphQLEntity, BaseLoaders } from '@exogee/graphweaver';
import { Collection, ReferenceType } from '@exogee/graphweaver-mikroorm';
import { Directive, Field, ID, ObjectType, Root } from 'type-graphql';

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

@ObjectType('AdminUiMetadata')
export class AdminUiMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	backendId!: string;

	@Field(() => [AdminField])
	async fields(@Root() adminUiMetadata: AdminUiMetadata) {
		return new Collection<AdminField>(this);
	}
}
