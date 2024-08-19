import { describe, test } from 'vitest';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { graphweaverApp } from './lambda';
import { Stack } from 'aws-cdk-lib';

const websiteTemplate = Template.fromStack(graphweaverApp.website);
const apiTemplate = Template.fromStack(graphweaverApp.api);
const databaseTemplate = Template.fromStack(graphweaverApp.database as Stack);

describe('GraphweaverApp - API Deployed to Lambda', () => {
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
				'Fn::GetAtt': [
					'TestGraphweaverDockerStackWebsiteWebsiteDistribution25D90871',
					'DomainName',
				],
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
							Ref: 'TestGraphweaverDockerStackApiApiGateway03E6A3A9',
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
							Ref: 'TestGraphweaverDockerStackApiApiGatewayDeploymentStageprod7376FDDA',
						},
						'/',
					],
				],
			},
		});

		apiTemplate.hasOutput('*', {
			Value: {
				'Fn::GetAtt': [
					'TestGraphweaverDockerStackApiApiGatewayCustomDomainA039BA27',
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
