import {
	BaseLoaders,
	GraphQLEntity,
	AdminUISettings,
	AdminUIFilterType,
} from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import { Account } from '../account';
import { Tenant } from '../tenant';

export interface XeroProfitAndLossRow {
	id: string;
	date: Date;
	description: string;
	accountId: string;
	tenantId: string;
	amount: number;
}

@ObjectType('ProfitAndLossRow')
export class ProfitAndLossRow extends GraphQLEntity<XeroProfitAndLossRow> {
	public dataEntity!: XeroProfitAndLossRow;

	@Field(() => ID)
	id!: string;

	@Field(() => Date)
	date!: Date;

	@AdminUISettings({
		filter: {
			type: AdminUIFilterType.TEXT,
		},
	})
	@Field(() => String)
	description!: string;

	@Field(() => Number)
	amount!: number;

	@Field(() => ID, { nullable: true })
	accountId?: string;

	@Field(() => Account, { nullable: true })
	async account() {
		if (!this.dataEntity.accountId) return null;

		return Account.fromBackendEntity(
			await BaseLoaders.loadOne({
				gqlEntityType: Account,
				id: this.dataEntity.accountId,
			})
		);
	}

	@Field(() => ID, { nullable: true })
	tenantId?: string;

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
