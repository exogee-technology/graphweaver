import { Resolver } from 'type-graphql';
import { createBaseResolver } from '@exogee/graphweaver';
import { getOneUser, getManyUsers, mapId, createUser, toggleUserStatus } from '../util';

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoUser } from './graphQLEntity';
import { CognitoUserBackendEntity } from './backendEntity';
import { createProvider } from '../base-resolver/provider';

export interface ItemWithId {
	id: string;
	[key: string]: unknown;
}
type Entity = CognitoUser;
type Context = {
	client: CognitoIdentityProviderClient;
	UserPoolId: string;
};
type DataEntity = CognitoUserBackendEntity;

export interface CreateAwsCognitoUserResolverOptions {
	region: string;
	userPoolId: string;
	endpoint?: string;
}

export const createAwsCognitoUserResolver = ({
	region,
	userPoolId,
	endpoint,
}: CreateAwsCognitoUserResolverOptions) => {
	const provider = createProvider<Entity, Context, DataEntity>({
		backendId: 'AWS',
		init: async () => {
			const client = new CognitoIdentityProviderClient({
				region,
				...(endpoint ? { endpoint } : {}),
			});

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
			const result = await createUser(client, UserPoolId, entity);
			return mapId(result.User);
		},
		update: async ({ client, UserPoolId }, entityId: string, entityWithChanges) => {
			const existingUser = await getOneUser(client, UserPoolId, entityId);

			// If the enabled status has changed, toggle it
			const enabled = entityWithChanges.dataEntity?.enabled;
			if (enabled !== undefined && existingUser.Enabled !== enabled) {
				await toggleUserStatus(client, UserPoolId, entityId, enabled);
			}

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
