import { Field, ID, GraphQLEntity, ObjectType, SummaryField } from '@exogee/graphweaver';

import { InterestDataEntity } from './data-entity';

@ObjectType()
export class Interest extends GraphQLEntity<InterestDataEntity> {
	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	name!: string;
}
