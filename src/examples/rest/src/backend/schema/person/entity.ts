import { GraphQLEntity, SummaryField } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';

import { People as RestPeople } from '../../entities';

@ObjectType('Person')
export class Person extends GraphQLEntity<RestPeople> {
	public dataEntity!: RestPeople;

	@Field(() => ID)
	id!: string;

	@SummaryField()
	@Field(() => String)
	name!: string;

	static async onBeforeRead(args: any) {
		console.log('onBeforeRead', args);
	}

	static async onAfterRead(args: any) {
		console.log('onAfterRead', args);
	}
}
