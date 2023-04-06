import { BaseEntity, Field } from '@exogee/graphweaver-rest';

export class People extends BaseEntity {
	@Field()
	name!: string;

	@Field()
	url!: string;
}
