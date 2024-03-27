import 'reflect-metadata';

import assert from 'assert';

import gql from 'graphql-tag';
import { CognitoUser, createAwsCognitoUserResolver } from '@exogee/graphweaver-aws-cognito';

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

beforeAll(async () => {
	await graphweaver.handler();
});

describe('basic query', () => {
	test('should get cognito users', async () => {
		const response = await graphweaver.server.executeOperation<{ cognitoUsers: CognitoUser[] }>({
			query: gql`
				query {
					cognitoUsers {
						id
					}
				}
			`,
		});

		assert(response.body.kind === 'single');

		expect(response.body.singleResult.data?.cognitoUsers).toHaveLength(1);
	});
});
