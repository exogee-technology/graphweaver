import {
	AdminUIFilterType,
	AdminUISettings,
	BaseLoaders,
	GraphQLEntity,
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

	@AdminUISettings({
		filter: {
			type: AdminUIFilterType.TEXT,
		},
	})
	@Field(() => String, { nullable: true })
	code?: string;

	@AdminUISettings({
		filter: {
			type: AdminUIFilterType.TEXT,
		},
	})
	@SummaryField()
	@Field(() => String)
	name!: string;

	@AdminUISettings({
		filter: {
			type: AdminUIFilterType.ENUM,
		},
	})
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
