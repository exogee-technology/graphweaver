import { Field, GraphQLEntity, ID, ObjectType, SummaryField } from '@exogee/graphweaver';

import { MailingListDataEntity } from './data-entity';

@ObjectType()
export class MailingList extends GraphQLEntity<MailingListDataEntity> {
	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	name!: string;
}
