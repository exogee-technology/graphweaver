import { Arg, Field, ID, ObjectType, Root, getMetadataStorage } from 'type-graphql';
import { BaseDataEntity, GraphQLEntity, ReadOnly, ReadOnlyProperty } from '@exogee/graphweaver';

import { CognitoUserBackendEntity } from './backendEntity';

@ObjectType('CognitoUser')
export class CognitoUser extends GraphQLEntity<CognitoUserBackendEntity> {
	@Field(() => ID)
	id!: string;

	@ReadOnlyProperty()
	@Field(() => String)
	async username(@Root() dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.Username;
	}

	@Field(() => Boolean)
	async enabled(@Root() dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.Enabled;
	}

	@ReadOnlyProperty()
	@Field(() => String, { nullable: true })
	async email(@Root() dataEntity: CognitoUserBackendEntity) {
		return (
			dataEntity.dataEntity.Attributes.find(
				(attribute: { Name: string }) => attribute.Name === 'email'
			)?.Value ?? null
		);
	}

	@Field(() => String)
	async userStatus(@Root() dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.UserStatus;
	}

	@Field(() => String)
	async groups(@Root() dataEntity: CognitoUserBackendEntity) {
		return dataEntity.dataEntity.Groups?.join(',') ?? '';
	}

	@Field(() => String, { nullable: true })
	async attributes(@Root() dataEntity: CognitoUserBackendEntity) {
		return JSON.stringify(dataEntity.dataEntity.Attributes);
	}
}
