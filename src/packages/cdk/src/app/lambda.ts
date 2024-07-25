import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { AccessLogFormat, LambdaRestApi, LogGroupLogDestination } from 'aws-cdk-lib/aws-apigateway';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

import { GraphweaverAppConfig } from './types';

export class LambdaStack extends cdk.Stack {
	public readonly lambda: lambda.Function;

	constructor(
		scope: Construct,
		id: string,
		database: {
			secretFullArn: string;
			instanceArn: string;
		},
		config: GraphweaverAppConfig,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

		if (!config.lambda) {
			throw new Error('Missing required lambda configuration');
		}

		// Create GraphQL Lambda Function
		this.lambda = new NodejsFunction(this, `${id}LambdaFunction`, {
			runtime: config.lambda.runtime ?? lambda.Runtime.NODEJS_20_X,
			handler: config.lambda.handler ?? 'index.handler',
			entry: require.resolve(config.lambda.packageName),
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
			memorySize: config.lambda.memorySize ?? 1024,
			architecture: lambda.Architecture.ARM_64,
			environment: {
				NODE_EXTRA_CA_CERTS: '/var/runtime/ca-cert.pem',
				DATABASE_SECRET_ARN: database.secretFullArn,
				...config.lambda.envVars,
			},
			timeout: cdk.Duration.seconds(config.lambda.timeout ?? 10),
		});

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
