import { Resolver } from 'type-graphql';
import { createProvider } from '@exogee/graphweaver-helpers';

import type { ItemWithId } from '@exogee/graphweaver-helpers';
import { createBaseResolver } from '@exogee/graphweaver';
import { getOneUser, getManyUsers, mapId, createUser, toggleUserStatus } from '../util';

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoUser } from './graphQLEntity';
import { CognitoUserBackendEntity } from './backendEntity';

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
			const existingUser = await getOneUser(client, UserPoolId, entityId);

			// If the enabled status has changed, toggle it
			if (existingUser.Enabled !== entityWithChanges.enabled) {
				await toggleUserStatus(client, UserPoolId, entityId, entityWithChanges.enabled);
			}

			// START HERE
			//updateUserAttributes(client, UserPoolId, entityId, entityWithChanges);
			return mapId(await getOneUser(client, UserPoolId, entityId));
		},
	});

	@Resolver((of) => CognitoUser)
	class CognitoUserResolver extends createBaseResolver<CognitoUser, CognitoUserBackendEntity>(
		CognitoUser,
		provider
	) {}

	return {
		resolver: CognitoUserResolver,
		entity: CognitoUser,
		provider,
	};
};
