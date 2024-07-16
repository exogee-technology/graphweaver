import { ResponseCustomHeader } from 'aws-cdk-lib/aws-cloudfront';
import { IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';

export type GraphweaverAppConfig = {
	name: string;
	database: {
		username: string;
		name: string;
	};
	adminUI: {
		cert: string;
		url: string;
		customHeaders?: ResponseCustomHeader[];
		csp?: string;
	};
	api: {
		cert: string;
		url: string;
		envVars: Record<string, string>;
	};
	network: {
		vpc: IVpc;
		graphqlSecurityGroup: SecurityGroup;
		dbSecurityGroup: SecurityGroup;
	};
};
