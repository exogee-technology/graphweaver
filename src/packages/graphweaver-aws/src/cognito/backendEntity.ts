import { BaseEntity, Field } from '@exogee/graphweaver-rest';

export class CognitoUserBackendEntity extends BaseEntity {
	@Field()
	id!: string;

	@Field()
	username!: string;

	@Field()
	enabled!: boolean;

	@Field()
	email!: string;

	@Field()
	userStatus!: string;

	@Field()
	groups!: string[];

	@Field()
	attributes!: string;
}
