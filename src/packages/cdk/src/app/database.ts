import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

import { GraphweaverAppConfig } from './types';

export class DatabaseStack extends cdk.NestedStack {
	public readonly dbInstance: rds.DatabaseInstance;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig, props?: cdk.StackProps) {
		super(scope, id, props);

		if (!config.database) {
			throw new Error('Missing required database configuration');
		}

		this.dbInstance = new rds.DatabaseInstance(this, `${id}Database`, {
			engine: rds.DatabaseInstanceEngine.postgres({
				version: config.database.version ?? rds.PostgresEngineVersion.VER_16_2,
			}),
			instanceType:
				config.database.instanceType ??
				ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
			instanceIdentifier: cdk.PhysicalName.GENERATE_IF_NEEDED,
			credentials: rds.Credentials.fromGeneratedSecret(config.database.username),
			vpc: config.network.vpc,
			storageEncrypted: true,
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
			},
			databaseName: config.database.name,
			securityGroups: [config.network.databaseSecurityGroup],

			// Allow them to override the default settings
			...config.database,
		});
	}
}
