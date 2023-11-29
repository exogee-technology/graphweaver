import { BaseEntity, Field } from '@exogee/graphweaver-rest';

export class SalesforceAccountBackendEntity extends BaseEntity {
	@Field()
	id!: string;

	@Field()
	name!: string;
}
