import { Arg, Field, ID, ObjectType, Root, Resolver, Mutation } from 'type-graphql';
import { createProvider, createEntity, createResolver } from '@exogee/graphweaver-helpers';

import type { ItemWithId } from '@exogee/graphweaver-helpers';
import { ReadOnly, createBaseResolver } from '@exogee/graphweaver';
import {
	getOneUser,
	getManyUsers,
	mapId,
	createUser,
	toggleUserStatus,
	updateUserAttributes,
} from '../util';

import {
	CognitoIdentityProviderClient,
	AdminSetUserPasswordCommand,
	AdminDisableUserCommandInput,
	AdminDisableUserCommand,
	AdminUpdateUserAttributesCommand,
	AdminUpdateUserAttributesCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

type Entity = ItemWithId;
type Context = any;
type DataEntity = any;

export interface CreateAwsCognitoUserResolverOptions {
	region: string;
	userPoolId: string;
}

export const createAwsCognitoUserResolver = ({
	region,
	userPoolId,
}: CreateAwsCognitoUserResolverOptions) => {
	const provider = createProvider<Entity, Context, DataEntity>({
		backendId: 'AWS',
		init: async () => {
			const client = new CognitoIdentityProviderClient({ region });

			return {
				client,
				UserPoolId: userPoolId,
			};
		},
		read: async ({ client, UserPoolId }, filter, pagination) => {
			if (filter?.id) return mapId(await getOneUser(client, UserPoolId, String(filter.id)));

			if (Array.isArray(filter?._or))
				return (await getManyUsers(client, UserPoolId, filter)).map(mapId);

			return (await getManyUsers(client, UserPoolId, filter)).map(mapId);
		},
		create: async ({ client, UserPoolId }, entity) => {
			return mapId(await createUser(client, UserPoolId, entity));
		},
		update: async ({ client, UserPoolId }, entityId: string, entityWithChanges) => {
			console.log('Update entity: ', entityWithChanges);
			console.log('Update entityId: ', entityId);

			const existingUser = await getOneUser(client, UserPoolId, entityId);
			console.log('existingUser: ', existingUser);

			//If the enabled status has changed, disable the user
			if (existingUser.Enabled !== entityWithChanges.enabled) {
				await toggleUserStatus(client, UserPoolId, entityId, entityWithChanges.enabled);
			}

			// START HERE
			// disableUser(client, UserPoolId, entityId);
			//updateUserAttributes(client, UserPoolId, entityId, entityWithChanges);
			return mapId(await getOneUser(client, UserPoolId, entityId));
		},
	});

	@ObjectType('CognitoUser')
	class CognitoUser {
		// @ReadOnly()
		@Field(() => ID)
		id!: string;

		@ReadOnly()
		@Field(() => String)
		async username(@Root() dataEntity: DataEntity) {
			return dataEntity.Username;
		}

		@Field(() => Boolean)
		async enabled(@Root() dataEntity: DataEntity) {
			return dataEntity.Enabled;
		}

		@ReadOnly()
		@Field(() => String, { nullable: true })
		async email(@Root() dataEntity: DataEntity) {
			return (
				dataEntity.Attributes.find((attribute: { Name: string }) => attribute.Name === 'email')
					?.Value ?? null
			);
		}

		@Field(() => String)
		async userStatus(@Root() dataEntity: DataEntity) {
			return dataEntity.UserStatus;
		}

		@Field(() => String)
		async groups(@Root() dataEntity: DataEntity) {
			return dataEntity.Groups?.join(',') ?? '';
		}

		@Field(() => String, { nullable: true })
		async attributes(@Root() dataEntity: DataEntity) {
			return JSON.stringify(dataEntity.Attributes);
		}
	}

	@Resolver(() => CognitoUser)
	class CognitoUserResolver extends createBaseResolver(CognitoUser, provider) {
		@Mutation(() => Boolean)
		async setCognitoUserPassword(
			@Arg('email', () => String) email: string,
			@Arg('password', () => String) password: string
		) {
			const client = new CognitoIdentityProviderClient({
				region: region,
			});
			const UserPoolId = process.env.COGNITO_USER_POOL_ID;

			await client.send(
				new AdminSetUserPasswordCommand({
					UserPoolId,
					Username: email,
					Password: password,
					Permanent: true,
				})
			);

			return true;
		}

		// @todo remove if we can do this via update
		// Function to disable a user
		@Mutation(() => Boolean)
		async disableUser(username: string) {
			const client = new CognitoIdentityProviderClient({
				region: region,
			});
			const UserPoolId = process.env.COGNITO_USER_POOL_ID;
			const params: AdminDisableUserCommandInput = {
				UserPoolId,
				Username: username,
			};

			try {
				const command = new AdminDisableUserCommand(params);
				await client.send(command);
				console.log(`User ${username} disabled successfully.`);
			} catch (error) {
				console.error(`Error disabling user ${username}:`, error);
			}
		}

		@Mutation(() => Boolean)
		async updateUserAttributes(
			username: string,
			userAttributes: { Name: string; Value: string }[]
		) {
			const client = new CognitoIdentityProviderClient({
				region: process.env.AWS_REGION,
			});
			const UserPoolId = process.env.COGNITO_USER_POOL_ID;
			const params: AdminUpdateUserAttributesCommandInput = {
				UserPoolId,
				Username: username,
				UserAttributes: userAttributes,
			};

			try {
				const command = new AdminUpdateUserAttributesCommand(params);
				await client.send(command);
				console.log(`User ${username} updated successfully.`);
				return true;
			} catch (error) {
				console.error(`Error updating user ${username}:`, error);
				return false;
			}
		}
	}

	return {
		resolver: CognitoUserResolver,
		entity: CognitoUser,
		provider,
	};
};
