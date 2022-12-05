import { BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType } from 'type-graphql';
import { Account } from '../account';

export interface XeroProfitAndLossRow {
	id: string;
	date: Date;
	description: string;
	accountId: string;
	amount: number;
}

@ObjectType('ProfitAndLossRow')
export class ProfitAndLossRow extends GraphQLEntity<XeroProfitAndLossRow> {
	public dataEntity!: XeroProfitAndLossRow;

	@Field(() => ID)
	id!: string;

	@Field(() => Date)
	date!: Date;

	@Field(() => String)
	description!: string;

	@Field(() => Number)
	amount!: number;

	@Field(() => ID)
	accountId!: string;

	@Field(() => Account, { nullable: true })
	async account() {
		if (!this.dataEntity.accountId) return null;

		const loaded = await BaseLoaders.loadOne({
			gqlEntityType: Account,
			id: this.dataEntity.accountId,
		});

		console.log('loaded: ', loaded);
		console.log('from ID: ', this.dataEntity.accountId);

		return Account.fromBackendEntity(loaded);
	}
}
