import { BaseEntity, Field } from '@exogee/graphweaver-rest';

export class People extends BaseEntity {
	@Field()
	id!: string;

	@Field()
	name!: string;
}
