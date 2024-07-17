import { ResponseCustomHeader } from 'aws-cdk-lib/aws-cloudfront';
import { IVpc, SecurityGroup, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { PostgresEngineVersion } from 'aws-cdk-lib/aws-rds';

export type GraphweaverAppConfig = {
	name: string;
	database: {
		// Username for the database
		username: string;
		// Name of the database
		name: string;
		// Instance type for the database
		instanceType?: InstanceType;
		// Postgres version for the database
		version?: PostgresEngineVersion;
	};
	adminUI: {
		// Path to the admin UI build directory (relative to the project root)
		buildPath: string;
		// ARN of the certificate in AWS Certificate Manager to use for the website
		cert: string;
		// Custom domain name for the website
		url: string;
		// Custom headers to add to the website
		customHeaders?: ResponseCustomHeader[];
		// Content Security Policy for the website
		csp?: string;
	};
	api: {
		// Name of the package containing the Graphweaver API
		packageName: string;
		// ARN of the certificate in AWS Certificate Manager to use for the API
		cert: string;
		// Custom domain name for the API
		url: string;
		// Environment variables to pass to the API Lambda function
		envVars: Record<string, string>;
		// Memory size for the API Lambda function
		memorySize?: number;
		// Timeout for the API Lambda function
		timeout?: number;
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
