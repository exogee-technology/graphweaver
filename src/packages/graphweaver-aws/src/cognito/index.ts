import { Arg, Field, ID, ObjectType, Root, Resolver, Mutation } from 'type-graphql';
import { createProvider, createEntity, createResolver } from '@exogee/graphweaver-helpers';

import type { ItemWithId } from '@exogee/graphweaver-helpers';
import { createBaseResolver } from '@exogee/graphweaver';
import { v4 } from 'uuid';
import { getOneUser, getManyUsers, mapId, createUser } from '../util';

import {
	CognitoIdentityProviderClient,
	AdminSetUserPasswordCommand,
	ListUsersCommandInput,
	ListUsersCommand,
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
	console.log('**********************************\n');
	console.log('createAwsCognitoUserResolver', region, userPoolId);
	console.log('**********************************\n');
	console.log(process.env.AWS_ACCESS_KEY_ID);
	console.log(process.env.AWS_SECRET_ACCESS_KEY);
	console.log(process.env.AWS_DEFAULT_REGION);

	const provider = createProvider<Entity, Context, DataEntity>({
		backendId: 'AWS',
		init: async () => {
			const client = new CognitoIdentityProviderClient({ region });
			// const params: ListUsersCommandInput = {
			// 	UserPoolId: userPoolId,
			// };

			// try {
			// 	const command = new ListUsersCommand(params);
			// 	const result = await client.send(command);

			// 	// Process the result, e.g., log or return user information
			// 	console.log('Users in the user pool:', result.Users);
			// } catch (error) {
			// 	console.error('Error listing users:', error);
			// }

			// try {
			// 	const data = await client;
			// 	// process data.
			// } catch (error) {
			// 	// error handling.
			// }

			return {
				client,
				UserPoolId: userPoolId,
			};
		},
		read: async ({ client, UserPoolId }, filter, pagination) => {
			console.log('read', filter, pagination);

			if (filter?.id) return mapId(await getOneUser(client, UserPoolId, String(filter.id)));

			if (Array.isArray(filter?._or))
				return (await getManyUsers(client, UserPoolId, filter)).map(mapId);

			return (await getManyUsers(client, UserPoolId, filter)).map(mapId);
		},
		create: async ({ client, UserPoolId }, entity) => {
			return mapId(await createUser(client, UserPoolId, entity));
		},
	});

	@ObjectType('CognitoUser')
	class CognitoUser {
		@Field(() => ID)
		id!: string;

		@Field(() => String, { nullable: true })
		async email(@Root() dataEntity: DataEntity) {
			return dataEntity.Attributes.find((attribute) => attribute.Name === 'email')?.Value ?? null;
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
	}

	return {
		resolver: CognitoUserResolver,
		entity: CognitoUser,
		provider,
	};
};
