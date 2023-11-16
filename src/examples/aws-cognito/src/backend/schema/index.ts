import { createAwsLambdaUtils } from '@exogee/graphweaver-aws';
import { cognitoUser } from '../cognito';

const awsLambdaUtils = createAwsLambdaUtils({
	...(process.env.AWS_LAMBDA_ENDPOINT ? { defaultEndpoint: process.env.AWS_LAMBDA_ENDPOINT } : {}),
});
console.log('cognitoUser', cognitoUser);
export const resolvers = [cognitoUser.resolver, awsLambdaUtils.resolver];
