import { BaseEntity, Field } from '@exogee/graphweaver-rest';

export class Account extends BaseEntity {
	@Field()
	name!: string;

	@Field()
	url!: string;
}
