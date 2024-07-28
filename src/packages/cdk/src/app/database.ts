import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

import { GraphweaverAppConfig } from './types';

export class DatabaseStack extends cdk.NestedStack {
	public readonly dbInstance: rds.DatabaseInstance;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig, props?: cdk.StackProps) {
		super(scope, id, props);

		const vpc = config.network.vpc;

		this.dbInstance = new rds.DatabaseInstance(this, `${id}Database`, {
			engine: rds.DatabaseInstanceEngine.postgres({
				version: config.database.version ?? rds.PostgresEngineVersion.VER_16_2,
			}),
			instanceType:
				config.database.instanceType ??
				ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
			instanceIdentifier: cdk.PhysicalName.GENERATE_IF_NEEDED,
			credentials: rds.Credentials.fromGeneratedSecret(config.database.username),
			vpc,
			storageEncrypted: true,
			vpcSubnets: {
				subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
			},
			databaseName: config.database.name,
			securityGroups: [config.network.databaseSecurityGroup],
		});

		if (!this.dbInstance.secret?.secretFullArn)
			throw new Error('Missing required secret ARN for database');

		if (!this.dbInstance.secret?.secretArn)
			throw new Error('Missing required secret ARN for database');

		new cdk.CfnOutput(this, `${id}DatabaseUrl`, {
			value: this.dbInstance.dbInstanceEndpointAddress,
		});

		// Export the secret ARN
		new cdk.CfnOutput(this, `${id}DatabaseSecretArn`, {
			value: this.dbInstance.secret?.secretArn,
			exportName: 'EcsExampleDatabaseSecretArn',
		});

		// Export the secret Full ARN
		new cdk.CfnOutput(this, `${id}DatabaseSecretFullArn`, {
			value: this.dbInstance.secret?.secretFullArn,
			exportName: 'EcsExampleDatabaseSecretFullArn',
		});

		// Export the instance ARN
		new cdk.CfnOutput(this, `${id}DatabaseInstanceArn`, {
			value: this.dbInstance.instanceArn,
			exportName: 'EcsExampleDatabaseInstanceArn',
		});
	}
}
