import request from 'supertest-graphql';
import gql from 'graphql-tag';
import { createAwsCognitoUserResolver } from '@exogee/graphweaver-aws';

import { Album } from '../../../../types';
import { config } from '../../../../config';
import Graphweaver from '@exogee/graphweaver-server';

if (!process.env.COGNITO_USER_POOL_ID) {
	throw new Error('Missing COGNITO_USER_POOL_ID');
}
const cognitoUser = createAwsCognitoUserResolver({
	userPoolId: process.env.COGNITO_USER_POOL_ID,
	region: 'ap-southeast-2',
});

const graphweaver = new Graphweaver({
	resolvers: [cognitoUser.resolver],
});

// describe('basic query', () => {
// 	test('should get cognito users', async () => {
// 		const { data } = await request<{ cognitoUsers: CognitoUser[] }>(config.baseUrl)
// 			.query(
// 				gql`
// 					query {
// 						cognitoUsers {
// 							id
// 						}
// 					}
// 				`
// 			)
// 			.expectNoErrors();

// 		expect(data?.cognitoUsers).toHaveLength(1);
// 	});
// });
