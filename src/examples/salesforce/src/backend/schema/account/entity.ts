import { GraphQLEntity, SummaryField, Field, ID, ObjectType } from '@exogee/graphweaver';

import { Account as RestAccount } from '../../entities/account';

@ObjectType('Account')
export class Account extends GraphQLEntity<RestAccount> {
	public dataEntity!: RestAccount;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;
}
