import { Construct } from 'constructs';
import { AppStack } from './app';
import { GraphweaverAppConfig } from './app/types';

const env = {
	account: process.env.AWS_ACCOUNT,
	region: process.env.AWS_DEFAULT_REGION,
};

export class GraphweaverApp extends Construct {
	public appStack: AppStack;
	constructor(scope: Construct, id: string, config: GraphweaverAppConfig) {
		super(scope, id);

		const stackName = `${id}-stack`;
		this.appStack = new AppStack(scope, stackName, config, { env });
	}
}
