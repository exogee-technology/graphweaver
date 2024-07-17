import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

import { GraphweaverAppConfig } from './types';

export class DatabaseStack extends cdk.Stack {
	public readonly dbInstance: rds.DatabaseInstance;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig, props?: cdk.StackProps) {
		super(scope, id, props);

		// RDS PostgreSQL Instance
		this.dbInstance = new rds.DatabaseInstance(this, `${id}-database`, {
			engine: rds.DatabaseInstanceEngine.postgres({
				version: config.database.version ?? rds.PostgresEngineVersion.VER_16_2,
			}),
			instanceType:
				config.database.instanceType ??
				ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
			credentials: rds.Credentials.fromGeneratedSecret(config.database.username),
			vpc: config.network.vpc,
			storageEncrypted: true,
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
			},
			databaseName: config.database.name,
			securityGroups: [config.network.databaseSecurityGroup],
		});

		new cdk.CfnOutput(this, `${id}-database-url`, {
			value: this.dbInstance.dbInstanceEndpointAddress,
		});
	}
}
