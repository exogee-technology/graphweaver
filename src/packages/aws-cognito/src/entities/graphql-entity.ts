import { ID, Entity, Field } from '@exogee/graphweaver';

import { CognitoUserBackendEntity } from './backend-entity';

@Entity('CognitoUser')
export class CognitoUser {
	public dataEntity!: CognitoUserBackendEntity;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	async username({ dataEntity }: CognitoUserBackendEntity) {
		return dataEntity.Username;
	}

	@Field(() => Boolean)
	async enabled({ dataEntity }: CognitoUserBackendEntity) {
		return dataEntity.Enabled;
	}

	@Field(() => String, { nullable: true })
	async email({ dataEntity }: CognitoUserBackendEntity) {
		return (
			dataEntity.Attributes.find((attribute: { Name: string }) => attribute.Name === 'email')
				?.Value ?? null
		);
	}

	@Field(() => String, { nullable: true })
	async userStatus({ dataEntity }: CognitoUserBackendEntity) {
		return dataEntity.UserStatus;
	}

	@Field(() => String, { nullable: true })
	async groups({ dataEntity }: CognitoUserBackendEntity) {
		return dataEntity.Groups?.join(',') ?? '';
	}

	@Field(() => String, { nullable: true })
	async attributes({ dataEntity }: CognitoUserBackendEntity) {
		return JSON.stringify(dataEntity.Attributes);
	}
}
