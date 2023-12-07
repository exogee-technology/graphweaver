import { Field, GraphQLEntity, ID, ObjectType, SummaryField } from '@exogee/graphweaver';

import { CategoryDataEntity } from '../../entities';

@ObjectType()
export class Category extends GraphQLEntity<CategoryDataEntity> {
	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	title!: string;
}
