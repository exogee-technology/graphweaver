import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { WebsiteStack } from './website';
import { DatabaseStack } from './database';
import { ApiStack } from './api';
import { GraphweaverAppConfig } from './types';

export class AppStack extends cdk.NestedStack {
	constructor(scope: Construct, id: string, config: GraphweaverAppConfig, props?: cdk.StackProps) {
		super(scope, id, props);

		new WebsiteStack(scope, `${id}-website`, config, props);
		const databaseStack = new DatabaseStack(scope, `${id}-database`, config, props);
		new ApiStack(scope, `${id}-api`, databaseStack, config, props);
	}
}
