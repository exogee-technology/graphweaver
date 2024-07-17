import { describe, test } from 'vitest';
import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { InstanceClass, InstanceSize, InstanceType, SecurityGroup, Vpc } from 'aws-cdk-lib/aws-ec2';
import { GraphweaverApp } from './index';
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

const graphweaverApp = new GraphweaverApp(stack, 'Test-Graphweaver', {
	name: 'test',
	network: {
		vpc,
		graphqlSecurityGroup,
		databaseSecurityGroup,
	},
	database: {
		name: 'gw_database_test',
		username: 'gw_user_test',
		version: PostgresEngineVersion.VER_13_12,
		instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
	},
	adminUI: {
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
	},
	api: {
		packageName: '@exogee/graphweaver',
		cert: 'arn:aws:acm:ap-southeast-2:test:test:test',
		url: 'api.test.com',
		memorySize: 512,
		envVars: {
			TEST_ENV_VAR: 'test',
		},
	},
});

const websiteTemplate = Template.fromStack(graphweaverApp.appStack.website);
const apiTemplate = Template.fromStack(graphweaverApp.appStack.api);
const databaseTemplate = Template.fromStack(graphweaverApp.appStack.database);

describe('GraphweaverApp', () => {
	test('AdminUI', () => {
		// Should create a S3 bucket to host the Admin UI
		websiteTemplate.resourceCountIs('AWS::S3::Bucket', 1);

		// Should create a CloudFront distribution to serve the Admin UI
		websiteTemplate.resourceCountIs('AWS::CloudFront::Distribution', 1);
		websiteTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
			DistributionConfig: {
				Aliases: ['admin-ui.test.com'],
			},
		});

		// Check that security and custom headers are added to the CloudFront distribution
		websiteTemplate.resourceCountIs('AWS::CloudFront::ResponseHeadersPolicy', 1);
		websiteTemplate.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
			ResponseHeadersPolicyConfig: {
				CustomHeadersConfig: {
					Items: [
						{
							Header: 'X-Graphweaver',
							Override: true,
							Value: 'true',
						},
					],
				},
				SecurityHeadersConfig: {
					ContentSecurityPolicy: {
						ContentSecurityPolicy: "default-src 'self';",
						Override: true,
					},
					ContentTypeOptions: {
						Override: true,
					},
					FrameOptions: {
						FrameOption: 'DENY',
						Override: true,
					},
					ReferrerPolicy: {
						Override: true,
						ReferrerPolicy: 'origin-when-cross-origin',
					},
					StrictTransportSecurity: {
						AccessControlMaxAgeSec: 63072000,
						IncludeSubdomains: true,
						Override: true,
						Preload: true,
					},
				},
			},
		});

		websiteTemplate.hasOutput('*', {
			Value: {
				'Fn::GetAtt': ['TestGraphweaverstackwebsitewebsitedistribution2478F6AD', 'DomainName'],
			},
		});
	});

	test('API', () => {
		apiTemplate.resourceCountIs('AWS::Lambda::Function', 1);
		apiTemplate.hasResourceProperties('AWS::Lambda::Function', {
			Architectures: ['arm64'],
			Environment: {
				Variables: {
					TEST_ENV_VAR: 'test',
				},
			},
			MemorySize: 512,
			VpcConfig: {
				SecurityGroupIds: [
					{
						'Fn::ImportValue': Match.stringLikeRegexp('GraphQLSecurityGroup'),
					},
				],
			},
		});

		apiTemplate.resourceCountIs('AWS::ApiGateway::RestApi', 1);
		apiTemplate.resourceCountIs('AWS::ApiGateway::DomainName', 1);
		apiTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
			DomainName: 'api.test.com',
			RegionalCertificateArn: 'arn:aws:acm:ap-southeast-2:test:test:test',
		});

		apiTemplate.resourceCountIs('AWS::ApiGateway::Method', 4);
		apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
			HttpMethod: 'OPTIONS',
			Integration: {
				IntegrationResponses: [
					{
						ResponseParameters: {
							'method.response.header.Access-Control-Allow-Origin': "'https://admin-ui.test.com'",
							'method.response.header.Access-Control-Allow-Methods': "'GET,POST,OPTIONS'",
							'method.response.header.Access-Control-Allow-Headers':
								"'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent,Xsrf-Token,X-Auth-Redirect,X-Auth-Request-Redirect,Apollo-Require-Preflight'",
						},
					},
				],
			},
		});

		apiTemplate.hasOutput('*', {
			Value: {
				'Fn::Join': [
					'',
					[
						'https://',
						{
							Ref: 'TestGraphweaverstackapiapigatewayBC09F9B6',
						},
						'.execute-api.',
						{
							Ref: 'AWS::Region',
						},
						'.',
						{
							Ref: 'AWS::URLSuffix',
						},
						'/',
						{
							Ref: 'TestGraphweaverstackapiapigatewayDeploymentStageprodF3A67CE7',
						},
						'/',
					],
				],
			},
		});

		apiTemplate.hasOutput('*', {
			Value: {
				'Fn::GetAtt': [
					'TestGraphweaverstackapiapigatewayCustomDomainC1C4A53C',
					'RegionalDomainName',
				],
			},
		});
	});

	test('Database', () => {
		databaseTemplate.resourceCountIs('AWS::RDS::DBInstance', 1);
		databaseTemplate.resourceCountIs('AWS::SecretsManager::Secret', 1);

		databaseTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
			DBName: 'gw_database_test',
			Engine: 'postgres',
			DBInstanceClass: 'db.t4g.micro',
			MasterUsername: 'gw_user_test',
			EngineVersion: '13.12',
			VPCSecurityGroups: [
				{
					'Fn::ImportValue': Match.stringLikeRegexp('DatabaseSecurityGroup'),
				},
			],
		});
	});
});
