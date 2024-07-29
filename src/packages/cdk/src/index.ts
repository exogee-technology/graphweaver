import { Construct } from 'constructs';
import { GraphweaverAppConfig } from './app/types';
import { WebsiteStack } from './app/website';
import { DatabaseStack } from './app/database';
import { LambdaStack } from './app/lambda';
import { EcsStack } from './app/ecs';

const env = {
	account: process.env.AWS_ACCOUNT,
	region: process.env.AWS_DEFAULT_REGION,
};

export class GraphweaverApp extends Construct {
	public readonly website: WebsiteStack;
	public readonly api: LambdaStack | EcsStack;
	public readonly database: DatabaseStack;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig) {
		super(scope, id);

		const stackName = `GraphweaverStack`;
		const props = { env };

		this.website = new WebsiteStack(scope, `${stackName}Website`, config, props);
		this.database = new DatabaseStack(scope, `${stackName}Database`, config, props);

		if (config.lambda && config.ecs) {
			throw new Error('Cannot specify both lambda and ecs configuration');
		}

		if (config.lambda) {
			this.api = new LambdaStack(scope, `${stackName}Api`, this.database, config, props);
		} else {
			this.api = new EcsStack(scope, `${stackName}Api`, this.database, config, props);
		}
	}
}
