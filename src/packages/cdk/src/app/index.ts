import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { WebsiteStack } from './website';
import { DatabaseStack } from './database';
import { LambdaStack } from './lambda';
import { EcsStack } from './ecs';
import { GraphweaverAppConfig } from './types';

export class AppStack extends cdk.NestedStack {
	public readonly website: WebsiteStack;
	public readonly database: DatabaseStack;
	public readonly api: LambdaStack | EcsStack;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig, props?: cdk.StackProps) {
		super(scope, id, props);

		this.website = new WebsiteStack(scope, `${id}Website`, config, props);
		this.database = new DatabaseStack(scope, `${id}Database`, config, props);

		if (config.lambda && config.ecs) {
			throw new Error('Cannot specify both lambda and ecs configuration');
		}

		if (!this.database.dbInstance.secret?.secretFullArn)
			throw new Error('Missing required secret ARN for database');

		const database = {
			secretFullArn: this.database.dbInstance.secret.secretFullArn,
			secretArn: this.database.dbInstance.secret.secretArn,
			instanceArn: this.database.dbInstance.instanceArn,
		};

		if (config.lambda) {
			this.api = new LambdaStack(scope, `${id}Api`, database, config, props);
			this.database.dbInstance.secret.grantRead((this.api as LambdaStack).lambda);
		} else {
			this.api = new EcsStack(scope, `${id}Api`, { ...database }, config, props);
		}
	}
}
