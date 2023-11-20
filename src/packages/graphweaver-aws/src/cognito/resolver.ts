import { Arg, Field, ID, ObjectType, Root, Resolver, Mutation } from 'type-graphql';
import { createProvider, createEntity, createResolver } from '@exogee/graphweaver-helpers';

import type { ItemWithId } from '@exogee/graphweaver-helpers';
import { GraphQLEntity, ReadOnly, createBaseResolver } from '@exogee/graphweaver';
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
import { CognitoUserBackendEntity } from './backendEntity';
import { CognitoUser } from './graphQLEntity';

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

			// If the enabled status has changed, toggle it
			if (existingUser.Enabled !== entityWithChanges.enabled) {
				await toggleUserStatus(client, UserPoolId, entityId, entityWithChanges.enabled);
			}

			// START HERE

			//updateUserAttributes(client, UserPoolId, entityId, entityWithChanges);
			return mapId(await getOneUser(client, UserPoolId, entityId));
		},
	});

	@Resolver(() => CognitoUser)
	class CognitoUserResolver extends createBaseResolver(CognitoUser as any, provider) {
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
	}

	return {
		resolver: CognitoUserResolver,
		entity: CognitoUser,
		provider,
	};
};
