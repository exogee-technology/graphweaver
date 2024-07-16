import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { AccessLogFormat, LambdaRestApi, LogGroupLogDestination } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

import { DatabaseStack } from './database';

import { GraphweaverAppConfig } from './types';

export class ApiStack extends cdk.Stack {
	public readonly lambda: lambda.Function;

	constructor(
		scope: Construct,
		id: string,
		databaseStack: DatabaseStack,
		config: GraphweaverAppConfig,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

		if (!databaseStack.dbInstance.secret?.secretFullArn)
			throw new Error('Missing required secret ARN for database');

		// Create GraphQL Lambda Function
		this.lambda = new NodejsFunction(this, `${id}-api-function`, {
			runtime: lambda.Runtime.NODEJS_20_X,
			handler: 'index.handler',
			entry: require.resolve(`@exogee/${config.name}`),
			bundling: {
				externalModules: [
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
			vpc: config.network.vpc,
			securityGroups: [config.network.graphqlSecurityGroup],
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
			},
			memorySize: 1024,
			architecture: lambda.Architecture.ARM_64,
			environment: {
				NODE_EXTRA_CA_CERTS: '/var/runtime/ca-cert.pem',
				DATABASE_SECRET_ARN: databaseStack.dbInstance.secret.secretFullArn,
				...config.api.envVars,
			},
			timeout: cdk.Duration.seconds(120),
		});

		databaseStack.dbInstance.secret.grantRead(this.lambda);

		const apiLogging = new LogGroup(this, `${id}-api-function-logging`);

		const certificateArn = config.api.cert;
		const certificate = Certificate.fromCertificateArn(
			this,
			`${id}-APICertificateImported`,
			certificateArn
		);

		const rest = new LambdaRestApi(this, `${id}-api-gateway`, {
			domainName: {
				domainName: config.api.url,
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

		new cdk.CfnOutput(this, `${id}-api-url`, {
			value: rest.domainName?.domainNameAliasDomainName || '',
		});
	}
}
