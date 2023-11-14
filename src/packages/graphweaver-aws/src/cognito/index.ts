import { Arg, Field, ID, ObjectType, Root, Resolver, Mutation } from 'type-graphql';
import { createProvider, createEntity, createResolver } from '@exogee/graphweaver-helpers';

import type { ItemWithId } from '@exogee/graphweaver-helpers';
import { createBaseResolver } from '@exogee/graphweaver';
import { v4 } from 'uuid';

import {
	CognitoIdentityProviderClient,
	ListUsersInGroupCommand,
	ListGroupsCommand,
	AdminGetUserCommand,
	AdminCreateUserCommand,
	AdminAddUserToGroupCommand,
	AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';

type Entity = ItemWithId;
type Context = any;
type DataEntity = any;

const createUser = async (
	client: CognitoIdentityProviderClient,
	UserPoolId: string,
	{ email, groups }: Partial<DataEntity>
) => {
	// Create user
	const user = await client.send(
		new AdminCreateUserCommand({
			UserPoolId,
			Username: email,
			UserAttributes: [
				{ Name: 'email', Value: email },
				{ Name: 'email_verified', Value: 'True' },
			],
		})
	);

	// Add user to specified groups
	if (groups) {
		for (const group of groups.split(',')) {
			await client.send(
				new AdminAddUserToGroupCommand({
					GroupName: group,
					Username: email,
					UserPoolId,
				})
			);
		}
	}

	if (!user) return null;
	return {
		...user,
		Groups: groups.split(','),
	};
};

// @todo add group
const getOneUser = async (
	client: CognitoIdentityProviderClient,
	UserPoolId: string,
	Username: string
): Promise<any> => {
	const user = await client.send(
		new AdminGetUserCommand({
			UserPoolId,
			Username,
		})
	);

	if (!user) return null;

	return {
		...user,
		Attributes: user.UserAttributes,
	};
};

const getManyUsers = async (
	client: CognitoIdentityProviderClient,
	UserPoolId: string,
	_filter: any
): Promise<any> => {
	const mappedUsers = new Map();

	// get groups
	const groups = (
		await client.send(
			new ListGroupsCommand({
				UserPoolId,
			})
		)
	).Groups;

	// for each group, get users
	// @todo max is 50, we need to paginate
	// @todo we should also get users not in a group?
	for (const group of groups) {
		const users = (
			await client.send(
				new ListUsersInGroupCommand({
					UserPoolId,
					GroupName: group.GroupName,
				})
			)
		).Users;

		for (const user of users) {
			const existingUser = mappedUsers.get(user.Username);
			mappedUsers.set(user.Username, {
				...user,
				Groups: [group.GroupName, ...(existingUser?.Groups ? [existingUser.Groups] : [])],
			});
		}
	}

	return [...mappedUsers.values()];
};

const mapId = (user: any): any => ({
	id: user.Username,
	...user,
});

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
			return {
				client: new CognitoIdentityProviderClient({ region }),
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
	});

	@ObjectType()
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
				region: 'ap-southeast-2',
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
