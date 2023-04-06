import { BaseEntity, Field } from '@exogee/graphweaver-rest';

export class People extends BaseEntity {
	@Field({ underlyingFieldName: 'url' })
	id!: string;

	@Field()
	name!: string;
}
