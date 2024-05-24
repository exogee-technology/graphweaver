import { getOneUser, getManyUsers, mapId, createUser, toggleUserStatus } from '../util';

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoUser, CognitoUserBackendEntity } from '../entities';
import { createProvider } from './base-provider';
import { BackendProvider, graphweaverMetadata } from '@exogee/graphweaver';

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

export const createAwsCognitoUserProvider = ({
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

	// Attach the entity to this provider
	graphweaverMetadata.collectProviderInformationForEntity<typeof CognitoUser, DataEntity>({
		provider: provider as BackendProvider<DataEntity, typeof CognitoUser>,
		target: CognitoUser,
	});

	return {
		entity: CognitoUser,
		provider,
	};
};
