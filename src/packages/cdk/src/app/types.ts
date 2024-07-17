import { ResponseCustomHeader } from 'aws-cdk-lib/aws-cloudfront';
import { IVpc, SecurityGroup, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';

export type GraphweaverAppConfig = {
	name: string;
	database: {
		// Username for the database
		username: string;
		// Name of the database
		name: string;
		// Instance type for the database, defaults to t4g.micro.
		instanceType?: InstanceType;
		// Postgres version for the database, defaults to VER_16_2
		version?: PostgresEngineVersion;
	};
	adminUI: {
		// Path to the admin UI build directory (relative to the project root)
		buildPath: string;
		// ARN of the certificate in AWS Certificate Manager to use for the website.
		// Because CloudFront requires it, this certificate must be in Certificate Manager in the `us-east-1` region.
		cert: string;
		// Custom domain name for the website
		url: string;
		// Custom headers to add to the website
		customHeaders?: ResponseCustomHeader[];
		// Content Security Policy for the website. Defaults to:
		// default-src 'self'; connect-src https://${config.api.url}; font-src 'self' fonts.gstatic.com data:; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' https://graphweaver.com;
		csp?: string;
	};
	api: {
		// Name of the package containing the Graphweaver API
		packageName: string;
		// ARN of the certificate in AWS Certificate Manager to use for the API
		// This must be in Certificate Manager in the region you intend to deploy the API to.
		cert: string;
		// Custom domain name for the API
		url: string;
		// Environment variables to pass to the API Lambda function
		envVars: Record<string, string>;
		// Memory size for the API Lambda function, defaults to 1024
		memorySize?: number;
		// Timeout for the API Lambda function. Defaults to 10s.
		timeout?: number;
		// Lambda runtime for the API such as Runtime.NODEJS_20_X, defaults to NODEJS_20_X
		runtime?: Runtime;
		// Lambda handler for the API
		handler?: string;
	};
	network: {
		// VPC to deploy the application into
		vpc: IVpc;
		// Security group for the GraphQL API
		graphqlSecurityGroup: SecurityGroup;
		// Security group for the database
		databaseSecurityGroup: SecurityGroup;
	};
};
