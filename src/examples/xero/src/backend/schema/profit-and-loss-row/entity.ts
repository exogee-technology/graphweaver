import { GraphQLEntity, AdminUISettings, RelationshipField } from '@exogee/graphweaver';
import { ISODateStringScalar } from '@exogee/graphweaver-scalars';
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

	@Field(() => ISODateStringScalar)
	date!: Date;

	@Field(() => String)
	description!: string;

	@Field(() => Number)
	amount!: number;

	@AdminUISettings({
		filter: {
			hide: true,
		},
	})
	@Field(() => ID, { nullable: true })
	accountId?: string;

	@RelationshipField<ProfitAndLossRow>(() => Account, { id: 'accountId' })
	account!: Account;

	@AdminUISettings({
		filter: {
			hide: true,
		},
	})
	@Field(() => ID, { nullable: true })
	tenantId?: string;

	@RelationshipField<ProfitAndLossRow>(() => Tenant, { id: 'tenantId' })
	tenant!: Tenant;
}
