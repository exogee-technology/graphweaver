import path from 'path';
import fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AmiHardwareType, Cluster, ContainerImage, EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedEc2Service } from 'aws-cdk-lib/aws-ecs-patterns';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

import { GraphweaverAppConfig } from './types';
import { DatabaseStack } from './database';

export class EcsStack extends cdk.NestedStack {
	public readonly service: ApplicationLoadBalancedEc2Service;

	constructor(
		scope: Construct,
		id: string,
		database: DatabaseStack,
		config: GraphweaverAppConfig,
		props?: cdk.StackProps
	) {
		super(scope, id, props);

		if (!config.ecs) {
			throw new Error('Missing required ECS configuration');
		}

		const vpc = config.network.vpc;

		// Copy the docker file to the build directory
		const dockerfilePath = path.resolve(__dirname, '../docker/Dockerfile');
		fs.copyFileSync(
			dockerfilePath,
			path.join(path.resolve(__dirname, '../..', config.ecs.buildPath), 'Dockerfile')
		);

		const image = new DockerImageAsset(this, `${id}GraphweaverAppImage`, {
			directory: config.ecs.buildPath,
			file: 'Dockerfile',
		});

		const cluster = new Cluster(scope, `${id}EcsCluster`, {
			capacity: {
				instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
				machineImage: EcsOptimizedImage.amazonLinux2023(AmiHardwareType.ARM),
				desiredCapacity: 1,
			},
			vpc,
		});

		const certificateArn = config.ecs.cert;
		const certificate = Certificate.fromCertificateArn(
			this,
			`${id}ApiCertificateImported`,
			certificateArn
		);

		if (!database.dbInstance.secret?.secretFullArn) {
			throw new Error('No database secret found.');
		}
		// Import the secret ARN and get the secret instance
		const databaseSecretArn = database.dbInstance.secret?.secretArn;
		const databaseSecretFullArn = database.dbInstance.secret?.secretFullArn;
		const databaseInstanceArn = database.dbInstance.instanceArn;

		const secretsManagerPolicy = new PolicyStatement({
			actions: ['secretsmanager:GetSecretValue'], // Allow reading secrets
			resources: [databaseSecretArn], // Only for this specific database secret
		});
		const rdsAccessPolicy = new PolicyStatement({
			actions: ['rds-db:connect', 'rds-data:*'], // Allow connection and data access
			resources: [databaseInstanceArn], // Only for this specific database
		});

		const taskRole = new Role(this, `${id}EcsTaskRole`, {
			assumedBy: new ServicePrincipal(`ecs-task.amazonaws.com`),
			roleName: cdk.PhysicalName.GENERATE_IF_NEEDED,
		});
		taskRole.addToPolicy(secretsManagerPolicy);
		taskRole.addToPolicy(rdsAccessPolicy);

		this.service = new ApplicationLoadBalancedEc2Service(scope, `${id}ALBService`, {
			cluster,

			taskImageOptions: {
				taskRole,
				image: ContainerImage.fromDockerImageAsset(image),
				containerPort: 3000,
				environment: {
					DATABASE_SECRET_ARN: databaseSecretFullArn,
					...config.ecs.envVars,
				},
			},

			cpu: config.ecs.cpuSize ?? 256,
			memoryLimitMiB: config.ecs.memorySize ?? 1024,

			// HTTPS
			certificate,
			protocol: ApplicationProtocol.HTTPS,
			redirectHTTP: true,
			// domainName: config.ecs.url,
			// domainZone: HostedZone.fromLookup(construct, 'hosted-zone', {
			// 	domainName: 'exogee.com',
			// }),
		});

		// Our health check is at a different path than /
		this.service.targetGroup.configureHealthCheck({
			path: '/health',
		});
	}
}
