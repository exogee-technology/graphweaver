import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType } from 'aws-cdk-lib/aws-ec2';
import { AmiHardwareType, Cluster, ContainerImage, EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedEc2Service } from 'aws-cdk-lib/aws-ecs-patterns';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';

import { GraphweaverAppConfig } from './types';
import { DatabaseStack } from './database';

export class EcsStack extends cdk.Stack {
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
		if (!database.dbInstance.secret?.secretFullArn)
			throw new Error('Missing required secret ARN for database');

		const image = new DockerImageAsset(this, `${id}GraphweaverAppImage`, {
			directory: './src/docker',
			file: 'Dockerfile',
			buildArgs: {
				APP_DIR: config.ecs.packageName,
			},
		});

		const cluster = new Cluster(scope, `${id}EcsCluster`, {
			capacity: {
				instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
				machineImage: EcsOptimizedImage.amazonLinux2023(AmiHardwareType.ARM),
				desiredCapacity: 1,
			},
			vpc: config.network.vpc,
		});

		const certificateArn = config.ecs.cert;
		const certificate = Certificate.fromCertificateArn(
			this,
			`${id}ApiCertificateImported`,
			certificateArn
		);

		const secretsManagerPolicy = new PolicyStatement({
			actions: ['secretsmanager:GetSecretValue'], // Allow reading secrets
			resources: [database.dbInstance.secret.secretArn], // Only for this specific database secret
		});
		const rdsAccessPolicy = new PolicyStatement({
			actions: ['rds-db:connect', 'rds-data:*'], // Allow connection and data access
			resources: [database.dbInstance.instanceArn], // Only for this specific database
		});

		const taskRole = new Role(this, `${id}EcsTaskRole`, {
			assumedBy: new ServicePrincipal(`ecs-task.amazonaws.com`),
		});
		taskRole.addToPolicy(secretsManagerPolicy);
		taskRole.addToPolicy(rdsAccessPolicy);

		const service = new ApplicationLoadBalancedEc2Service(scope, `${id}ALBService`, {
			cluster,

			taskImageOptions: {
				taskRole,
				image: ContainerImage.fromDockerImageAsset(image),
				containerPort: 3000,
				environment: {
					DATABASE_SECRET_ARN: database.dbInstance.secret.secretFullArn,
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
		service.targetGroup.configureHealthCheck({
			path: '/health',
		});
	}
}
