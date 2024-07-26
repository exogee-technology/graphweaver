import { Construct } from 'constructs';
import { GraphweaverAppConfig } from './app/types';
import { WebsiteStack } from './app/website';
import { DatabaseStack } from './app/database';
import { LambdaStack } from './app/lambda';
import { EcsStack } from './app/ecs';
import { Stack } from 'aws-cdk-lib';

const env = {
	account: process.env.AWS_ACCOUNT,
	region: process.env.AWS_DEFAULT_REGION,
};

export class GraphweaverApp extends Construct {
	public readonly website: WebsiteStack;
	public readonly database: DatabaseStack;
	public readonly api: LambdaStack | EcsStack;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig) {
		super(scope, id);

		const stackName = `${id}Stack`;
		const stack = new Stack(scope, `${id}Stack`);

		const props = { env };

		this.website = new WebsiteStack(stack, `${stackName}Website`, config, props);
		this.database = new DatabaseStack(stack, `${stackName}Database`, config, props);

		if (config.lambda && config.ecs) {
			throw new Error('Cannot specify both lambda and ecs configuration');
		}

		if (config.lambda) {
			this.api = new LambdaStack(stack, `${stackName}Api`, this.database, config, props);
		} else {
			this.api = new EcsStack(stack, `${stackName}Api`, this.database, config, props);
		}
	}
}
