import { describe, test } from 'vitest';
import { Template } from 'aws-cdk-lib/assertions';
import { graphweaverApp } from './ecs';
import { Stack } from 'aws-cdk-lib';

const websiteTemplate = Template.fromStack(graphweaverApp.website);
const databaseTemplate = Template.fromStack(graphweaverApp.database as Stack);

describe('GraphweaverApp - API Deployed to ECS', () => {
	test('AdminUI', () => {
		// Should create a S3 bucket to host the Admin UI
		websiteTemplate.resourceCountIs('AWS::S3::Bucket', 1);

		// Should create a CloudFront distribution to serve the Admin UI
		websiteTemplate.resourceCountIs('AWS::CloudFront::Distribution', 1);
		websiteTemplate.hasResourceProperties('AWS::CloudFront::Distribution', {
			DistributionConfig: {
				Aliases: ['admin-ui-ecs.graphweaver.com'],
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
						ContentSecurityPolicy:
							"default-src 'self'; connect-src https://api-ecs.graphweaver.com; font-src 'self' fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' https://graphweaver.com;",
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
				'Fn::GetAtt': ['GraphweaverStackWebsiteWebsiteDistributionC9A031FA', 'DomainName'],
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
		});
	});
});
