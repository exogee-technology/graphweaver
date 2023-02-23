import { BaseLoaders, GraphQLEntity, SummaryField } from '@exogee/graphweaver';
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
	@Field(() => String)
	name!: string;

	@Field(() => AccountType)
	type!: AccountType;

	@Field(() => String)
	tenantId!: string;

	@Field(() => Tenant, { nullable: true })
	async tenant() {
		if (!this.dataEntity.tenantId) return null;

		return Tenant.fromBackendEntity(
			await BaseLoaders.loadOne({
				gqlEntityType: Tenant,
				id: this.dataEntity.tenantId,
			})
		);
	}
}
