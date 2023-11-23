import { createAwsCognitoUserResolver } from '@exogee/graphweaver-aws';

export const cognitoUser =
	process.env.COGNITO_USER_POOL_ID &&
	createAwsCognitoUserResolver({
		userPoolId: process.env.COGNITO_USER_POOL_ID,
		region: 'ap-southeast-2',
	});
