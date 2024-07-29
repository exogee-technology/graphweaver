import path from 'path';
import fs from 'fs';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { InstanceClass, InstanceSize, InstanceType, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AmiHardwareType, Cluster, ContainerImage, EcsOptimizedImage } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedEc2Service } from 'aws-cdk-lib/aws-ecs-patterns';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';

import { GraphweaverAppConfig } from './types';
import { DatabaseStack } from './database';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

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

		// ⚠️ Avoid using the database root user in the application layer. ⚠️
		// Create a dedicated user with limited permissions and pass its credentials via a secret manager ARN.
		// This is a best practice for security and compliance.
		const databaseSecretFullArn =
			config.ecs.databaseSecretFullArn ?? database.dbInstance.secret?.secretFullArn;

		if (!databaseSecretFullArn) {
			throw new Error('No database secret found.');
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

		const cluster = new Cluster(scope, `${id}EcsCluster`, { vpc });

		const autoScalingGroup = cluster.addCapacity('DefaultAutoScalingGroup', {
			instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.MICRO),
			machineImage: EcsOptimizedImage.amazonLinux2023(AmiHardwareType.ARM),
			desiredCapacity: 1,
			vpcSubnets: {
				subnetType: SubnetType.PRIVATE_WITH_EGRESS,
			},
		});

		// Add the security group to the ec2 resources that used by your cluster
		autoScalingGroup.addSecurityGroup(config.network.graphqlSecurityGroup);

		const certificateArn = config.ecs.cert;
		const certificate = Certificate.fromCertificateArn(
			this,
			`${id}ApiCertificateImported`,
			certificateArn
		);

		this.service = new ApplicationLoadBalancedEc2Service(scope, `${id}ALBService`, {
			cluster,

			taskImageOptions: {
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
			domainName: config.ecs.url,
			// domainZone: HostedZone.fromLookup(construct, 'hosted-zone', {
			// 	domainName: 'exogee.com',
			// }),
		});

		// ⚠️ Grant the ec2 instance access to the database secret ⚠️
		// This only happens when using the default secret from the database stack
		// If a custom secret is provided, the user is responsible for granting access to the Lambda function
		// Again, it is a best practice to use your own secret and manage the permissions.
		if (
			database.dbInstance.secret?.secretFullArn &&
			databaseSecretFullArn === database.dbInstance.secret?.secretFullArn
		) {
			const secretsManagerPolicy = new PolicyStatement({
				actions: ['secretsmanager:GetSecretValue'], // Allow reading secrets
				resources: [databaseSecretFullArn], // Only for this specific database secret
			});

			this.service.taskDefinition.addToTaskRolePolicy(secretsManagerPolicy);
		}

		// Our health check is at a different path than /
		this.service.targetGroup.configureHealthCheck({
			path: '/health',
		});
	}
}
