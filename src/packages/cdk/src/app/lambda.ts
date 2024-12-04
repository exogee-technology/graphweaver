import path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { AccessLogFormat, LambdaRestApi, LogGroupLogDestination } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

import { GraphweaverAppConfig } from './types';
import { DatabaseStack } from './database';

export class LambdaStack extends cdk.NestedStack {
	public readonly lambda: lambda.Function;

	constructor(
		scope: Construct,
		id: string,
		config: GraphweaverAppConfig,
		database?: DatabaseStack,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

		if (!config.lambda) {
			throw new Error('Missing required lambda configuration');
		}

		if (!config.lambda.packageName && !config.lambda.buildPath) {
			throw new Error('Missing required lambda packageName or buildPath');
		}
		if (config.lambda.packageName && config.lambda.buildPath) {
			throw new Error('Cannot provide both packageName and buildPath');
		}

		// ⚠️ Avoid using the database root user in the application layer. ⚠️
		// Create a dedicated user with limited permissions and pass its credentials via a secret manager ARN.
		// This is a best practice for security and compliance.
		const databaseSecretFullArn =
			config.lambda.databaseSecretFullArn ?? database?.dbInstance.secret?.secretFullArn;

		const vpc = config.network.vpc;

		// Create GraphQL Lambda Function
		this.lambda = new NodejsFunction(this, `${id}LambdaFunction`, {
			runtime: config.lambda.runtime ?? lambda.Runtime.NODEJS_20_X,
			handler: config.lambda.handler ?? 'index.handler',
			entry: config.lambda.packageName
				? require.resolve(config.lambda.packageName)
				: config.lambda.buildPath,
			bundling: {
				externalModules: [
					'@aws-sdk/*',
					'sqlite3',
					'better-sqlite3',
					'pg-query-stream',
					'tedious',
					'mysql',
					'oracledb',
					'mariadb',
					'libsql',
				],
			},
			vpc,
			securityGroups: [config.network.graphqlSecurityGroup],
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
			},
			memorySize: config.lambda.memorySize ?? 1024,
			architecture: lambda.Architecture.ARM_64,
			environment: {
				NODE_EXTRA_CA_CERTS: '/var/runtime/ca-cert.pem',
				...(databaseSecretFullArn ? { DATABASE_SECRET_ARN: databaseSecretFullArn } : {}),
				...config.lambda.envVars,
			},
			timeout: cdk.Duration.seconds(config.lambda.timeout ?? 10),
		});

		// ⚠️ Grant the Lambda function access to the database secret ⚠️
		// This only happens when using the default secret from the database stack
		// If a custom secret is provided, the user is responsible for granting access to the Lambda function
		// Again, this is a best practice to use your own secret and manage the permissions.
		if (
			database?.dbInstance.secret?.secretFullArn &&
			databaseSecretFullArn === database.dbInstance.secret?.secretFullArn
		) {
			database.dbInstance.secret.grantRead(this.lambda);
		}

		const apiLogging = new LogGroup(this, `${id}LambdaFunctionLogging`);

		const certificateArn = config.lambda.cert;
		const certificate = Certificate.fromCertificateArn(
			this,
			`${id}ApiCertificateImported`,
			certificateArn
		);

		const rest = new LambdaRestApi(this, `${id}ApiGateway`, {
			domainName: {
				domainName: config.lambda.url,
				certificate,
			},
			deployOptions: {
				accessLogDestination: new LogGroupLogDestination(apiLogging),
				accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
			},
			defaultCorsPreflightOptions: {
				allowOrigins: [`https://${config.adminUI.url}`],
				allowMethods: ['GET', 'POST', 'OPTIONS'],
				allowHeaders: [
					'Content-Type',
					'X-Amz-Date',
					'Authorization',
					'X-Api-Key',
					'X-Amz-Security-Token',
					'X-Amz-User-Agent',
					'Xsrf-Token',
					'X-Auth-Redirect',
					'X-Auth-Request-Redirect',
					'Apollo-Require-Preflight',
				],
			},
			handler: this.lambda,
		});

		new cdk.CfnOutput(this, `${id}ApiUrl`, {
			value: rest.domainName?.domainNameAliasDomainName || '',
		});
	}
}
