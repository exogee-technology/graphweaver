import {
	AdminUISettings,
	GraphQLEntity,
	RelationshipField,
	SummaryField,
} from '@exogee/graphweaver';
import { Field, ID, ObjectType, registerEnumType } from 'type-graphql';
import { Account as XeroAccount, AccountType } from 'xero-node';
import { Tenant } from '../tenant';

registerEnumType(AccountType, { name: 'AccountType' });

@ObjectType('Account')
export class Account extends GraphQLEntity<XeroAccount> {
	public dataEntity!: XeroAccount & { tenantId: string };

	@Field(() => ID)
	id!: string;

	@Field(() => String, { nullable: true })
	code?: string;

	@SummaryField()
	@Field(() => String, { nullable: true })
	name?: string;

	@Field(() => AccountType, { nullable: true })
	type?: AccountType;

	@AdminUISettings({
		filter: {
			hide: true,
		},
	})
	@Field(() => String)
	tenantId!: string;

	@RelationshipField<Account>(() => Tenant, { id: 'tenantId' })
	tenant!: Tenant;
}
