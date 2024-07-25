import { App, Stack } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { GraphweaverApp } from '../index';
import { PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';

const mockApp = new App();
const stack = new Stack(mockApp, 'MyStack');
const vpc = new Vpc(stack, 'MyVpc');
const graphqlSecurityGroup = new SecurityGroup(stack, 'GraphQLSecurityGroup', {
	vpc,
});
const databaseSecurityGroup = new SecurityGroup(stack, 'DatabaseSecurityGroup', {
	vpc,
});

const network = {
	vpc,
	graphqlSecurityGroup,
	databaseSecurityGroup,
};
const database = {
	name: 'gw_database_test',
	username: 'gw_user_test',
	version: PostgresEngineVersion.VER_13_12,
	instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
};
const adminUI = {
	buildPath: '/',
	cert: 'arn:aws:acm:us-east-1:test:test:test',
	url: 'admin-ui.test.com',
	csp: "default-src 'self';",
	customHeaders: [
		{
			header: 'X-Graphweaver',
			value: 'true',
			override: true,
		},
	],
};

// new GraphweaverApp(stack, 'TestGraphweaverLambda', {
// 	name: 'testLambda',
// 	network,
// 	database,
// 	adminUI,
// 	lambda: {
// 		packageName: '@exogee/graphweaver',
// 		cert: 'arn:aws:acm:ap-southeast-2:test:test:test',
// 		url: 'api.test.com',
// 		memorySize: 512,
// 		envVars: {
// 			TEST_ENV_VAR: 'test',
// 		},
// 	},
// });

new GraphweaverApp(mockApp, 'TestGraphweaverDocker', {
	name: 'testDocker',
	network,
	database,
	adminUI,
	ecs: {
		packageName: '@exogee/graphweaver',
		cert: 'arn:aws:acm:ap-southeast-2:test:test:test',
		url: 'api.test.com',
		memorySize: 512,
		envVars: {
			TEST_ENV_VAR: 'test',
		},
	},
});
