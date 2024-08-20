import { App } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { GraphweaverApp } from '../index';
import { PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

const app = new App();

// Start by defining the network stack this will setup the VPC and security groups
class NetworkStack extends cdk.NestedStack {
	public readonly vpc: ec2.Vpc;
	public readonly graphqlSecurityGroup: ec2.SecurityGroup;
	public readonly databaseSecurityGroup: ec2.SecurityGroup;

	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		this.vpc = new ec2.Vpc(this, 'Vpc');
		this.graphqlSecurityGroup = new ec2.SecurityGroup(this, 'GraphQLSecurityGroup', {
			vpc: this.vpc,
		});
		this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
			vpc: this.vpc,
		});
	}
}

const env = {
	account: process.env.AWS_ACCOUNT ?? '123456789012',
	region: process.env.AWS_DEFAULT_REGION ?? 'ap-southeast-2',
};

const stackName = `GraphweaverStack`;
const rootStack = new cdk.Stack(app, stackName, { env });

// Create the network stack and configure the network object that is passed to the GraphweaverApp
const networkStack = new NetworkStack(rootStack, 'MyNetworkStack', { env });

// Create the GraphweaverApp
export const graphweaverApp = new GraphweaverApp(rootStack, 'TestGraphweaverDocker', {
	name: 'testDocker',
	network: {
		vpc: networkStack.vpc,
		graphqlSecurityGroup: networkStack.graphqlSecurityGroup,
		databaseSecurityGroup: networkStack.databaseSecurityGroup,
	},
	database: {
		name: 'gw_database_test',
		username: 'gw_user_test',
		version: PostgresEngineVersion.VER_13_12,
		instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
	},
	adminUI: {
		buildPath: '../../../../examples/rest/.graphweaver/admin-ui',
		cert: process.env.WEBSITE_CERTIFICATE_ARN ?? 'arn:aws:acm:us-east-1:test:test:test',
		url: 'admin-ui-ecs.graphweaver.com',
		customHeaders: [
			{
				header: 'X-Graphweaver',
				value: 'true',
				override: true,
			},
		],
	},
	ecs: {
		buildPath: '../../examples/rest/dist/backend',
		cert: process.env.API_CERTIFICATE_ARN ?? 'arn:aws:acm:ap-southeast-2:test:test:test',
		url: 'api-ecs.graphweaver.com',
		hostedZone: 'graphweaver.com',
		memorySize: 512,
		envVars: {
			TEST_ENV_VAR: 'test',
		},
	},
});
