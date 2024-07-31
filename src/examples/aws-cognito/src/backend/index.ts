import Graphweaver from '@exogee/graphweaver-server';
import { createAwsCognitoUserProvider } from '@exogee/graphweaver-aws';

export const cognitoUser = createAwsCognitoUserProvider({
	userPoolId: process.env.COGNITO_USER_POOL_ID,
	region: process.env.AWS_REGION,
	endpoint: process.env.COGNITO_ENDPOINT,
});

export const graphweaver = new Graphweaver();
