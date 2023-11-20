import {
	CognitoIdentityProviderClient,
	ListUsersInGroupCommand,
	ListGroupsCommand,
	AdminGetUserCommand,
	AdminCreateUserCommand,
	AdminAddUserToGroupCommand,
	ListUsersCommandInput,
	ListUsersCommand,
	AdminSetUserPasswordCommand,
	AdminDisableUserCommand,
	AdminEnableUserCommand,
	AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

type DataEntity = any;

export const createUser = async (
	client: CognitoIdentityProviderClient,
	UserPoolId: string,
	{ email, groups, username }: Partial<DataEntity>
): Promise<any> => {
	// Create user
	const user = await client.send(
		new AdminCreateUserCommand({
			UserPoolId,
			Username: username,
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
export const getOneUser = async (
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

export const getManyUsers = async (
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
	if (groups) {
		for (const group of groups) {
			const users = (
				await client.send(
					new ListUsersInGroupCommand({
						UserPoolId,
						GroupName: group.GroupName,
					})
				)
			).Users;
			if (!users) return;
			for (const user of users) {
				const existingUser = mappedUsers.get(user.Username);
				mappedUsers.set(user.Username, {
					...user,
					Groups: [group.GroupName, ...(existingUser?.Groups ? [existingUser.Groups] : [])],
				});
			}
		}
	}
	// Get users without groups
	try {
		const command = new ListUsersCommand({
			UserPoolId,
		});
		const result = await client.send(command);
		if (!result.Users) return;
		for (const user of result.Users) {
			const existingUser = mappedUsers.get(user.Username);
			mappedUsers.set(user.Username, {
				...user,
				Groups: [...(existingUser?.Groups ? [existingUser.Groups] : [])],
			});
		}
	} catch (error) {
		console.error('Error getting users without group:', error);
	}

	return [...mappedUsers.values()];
};

export const mapId = (user: any): any => ({
	id: user.Username,
	...user,
});

export const setUserPassword = async (
	client: CognitoIdentityProviderClient,
	UserPoolId: string,
	username: string,
	password: string
): Promise<any> => {
	return client.send(
		new AdminSetUserPasswordCommand({
			UserPoolId,
			Username: username,
			Password: password,
			Permanent: true,
		})
	);
};

export const toggleUserStatus = async (
	client: CognitoIdentityProviderClient,
	UserPoolId: string,
	username: string,
	isEnableUser: boolean
): Promise<any> => {
	const params = {
		UserPoolId,
		Username: username,
	};

	try {
		const command = isEnableUser
			? new AdminEnableUserCommand(params)
			: new AdminDisableUserCommand(params);

		await client.send(command);
		console.log(
			`User ${username} status set to ${isEnableUser ? 'enabled' : 'disabled'} successfully`
		);
	} catch (error) {
		console.error(`Error setting user ${username} status:`, error);
	}
};

export const updateUserAttributes = async (
	client: CognitoIdentityProviderClient,
	UserPoolId: string,
	username: string,
	entityWithChanges: {
		id?: string;
		[key: string]: any;
	}
): Promise<any> => {
	const params = {
		UserPoolId,
		Username: username,
		UserAttributes: Object.keys(entityWithChanges)
			.filter((key) => key !== 'id')
			.map((key) => ({ Name: key, Value: entityWithChanges[key] })),
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
};
