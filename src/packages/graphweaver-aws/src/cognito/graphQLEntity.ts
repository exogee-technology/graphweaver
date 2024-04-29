import { GraphQLEntity, Field, ID, Entity } from '@exogee/graphweaver';

import { CognitoUserBackendEntity } from './backendEntity';

@Entity('CognitoUser')
export class CognitoUser extends GraphQLEntity<CognitoUserBackendEntity> {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { readonly: true })
	async username(dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.Username;
	}

	@Field(() => Boolean)
	async enabled(dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.Enabled;
	}

	@Field(() => String, { nullable: true, readonly: true })
	async email(dataEntity: CognitoUserBackendEntity) {
		return (
			dataEntity.dataEntity.Attributes.find(
				(attribute: { Name: string }) => attribute.Name === 'email'
			)?.Value ?? null
		);
	}

	@Field(() => String)
	async userStatus(dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.UserStatus;
	}

	@Field(() => String)
	async groups(dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.Groups?.join(',') ?? '';
	}

	@Field(() => String, { nullable: true })
	async attributes(dataEntity: CognitoUserBackendEntity) {
		return JSON.stringify(dataEntity.dataEntity.Attributes);
	}
}
