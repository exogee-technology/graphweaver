import path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

import { GraphweaverAppConfig } from './types';

export class WebsiteStack extends cdk.Stack {
	public readonly distribution: cloudfront.Distribution;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig, props?: cdk.StackProps) {
		super(scope, id, props);

		const websiteBucket = new s3.Bucket(this, `${id}Bucket`, {
			websiteIndexDocument: 'index.html',
			publicReadAccess: true,
			blockPublicAccess: new s3.BlockPublicAccess({
				blockPublicAcls: false,
				blockPublicPolicy: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false,
			}),
		});

		new s3deploy.BucketDeployment(this, `${id}BucketDeployment`, {
			sources: [s3deploy.Source.asset(path.join(__dirname, config.adminUI.buildPath))], // Path to your built website files
			destinationBucket: websiteBucket,
		});

		const certificateArn = config.adminUI.cert;
		const certificate = Certificate.fromCertificateArn(
			this,
			`${id}WebsiteCertificateImported`,
			certificateArn
		);

		const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
			this,
			`${id}ResponseHeadersPolicy`,
			{
				responseHeadersPolicyName: `${id}AdminUIResponseHeadersPolicy`,
				comment: 'The policy used for the Admin UI website.',
				corsBehavior: undefined,
				customHeadersBehavior: {
					customHeaders: [...(config.adminUI.customHeaders ? config.adminUI.customHeaders : [])],
				},
				securityHeadersBehavior: {
					contentSecurityPolicy: {
						contentSecurityPolicy:
							config.adminUI.csp ??
							`default-src 'self'; connect-src https://${config.api.url}; font-src 'self' fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' https://graphweaver.com;`,
						override: true,
					},
					contentTypeOptions: { override: true },
					frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
					referrerPolicy: {
						referrerPolicy: cloudfront.HeadersReferrerPolicy.ORIGIN_WHEN_CROSS_ORIGIN,
						override: true,
					},
					strictTransportSecurity: {
						accessControlMaxAge: cdk.Duration.seconds(63072000), // 2 years
						includeSubdomains: true,
						override: true,
						preload: true,
					},
				},
				removeHeaders: [],
			}
		);

		this.distribution = new cloudfront.Distribution(this, `${id}WebsiteDistribution`, {
			certificate,
			domainNames: [config.adminUI.url],
			defaultBehavior: {
				origin: new origins.HttpOrigin(websiteBucket.bucketWebsiteDomainName, {
					protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
					httpPort: 80,
					httpsPort: 443,
				}),
				responseHeadersPolicy,
				viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, // Force HTTPS
				allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
				compress: true,
			},
			defaultRootObject: 'index.html',
			errorResponses: [
				// This error config will catch all errors and redirect to index.html
				{
					httpStatus: 404, // Catch-all error code
					responseHttpStatus: 200,
					responsePagePath: '/index.html',
					ttl: cdk.Duration.seconds(0),
				},
			],
		});

		new cdk.CfnOutput(this, `${id}WebsiteUrl`, {
			value: this.distribution.distributionDomainName,
		});
	}
}
