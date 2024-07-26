import { describe, test } from 'vitest';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { graphweaverApp } from './ecs';

const websiteTemplate = Template.fromStack(graphweaverApp.website);
const apiTemplate = Template.fromStack(graphweaverApp.api);
const databaseTemplate = Template.fromStack(graphweaverApp.database);

console.log(JSON.stringify(apiTemplate));

describe('GraphweaverApp - API Deployed to ECS', () => {
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

	test('API', () => {});

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
