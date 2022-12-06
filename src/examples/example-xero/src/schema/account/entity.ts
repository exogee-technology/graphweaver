import { GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import { Account as XeroAccount, AccountType } from 'xero-node';

registerEnumType(AccountType, { name: 'AccountType' });

@ObjectType('Account')
// TODO: How should we type fromBackendEntity so the generics agree?
//       That or we should add an easy way to alias for Xero entities so we don't even need this.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export class Account extends GraphQLEntity<XeroAccount> {
	public dataEntity!: XeroAccount;

	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	code?: string;

	@Field(() => String)
	name!: string;

	@Field(() => AccountType)
	type!: AccountType;
}
