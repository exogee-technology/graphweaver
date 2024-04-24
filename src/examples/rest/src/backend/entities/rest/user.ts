import { BaseEntity, Field } from '@exogee/graphweaver-rest';

export class User extends BaseEntity {
	@Field()
	name!: string;

	@Field()
	url!: string;
}
