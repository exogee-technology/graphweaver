import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { WebsiteStack } from './website';
import { DatabaseStack } from './database';
import { ApiStack } from './api';
import { GraphweaverAppConfig } from './types';

export class AppStack extends cdk.NestedStack {
	public readonly website: WebsiteStack;
	public readonly database: DatabaseStack;
	public readonly api: ApiStack;

	constructor(scope: Construct, id: string, config: GraphweaverAppConfig, props?: cdk.StackProps) {
		super(scope, id, props);

		this.website = new WebsiteStack(scope, `${id}Website`, config, props);
		this.database = new DatabaseStack(scope, `${id}Database`, config, props);
		this.api = new ApiStack(scope, `${id}Api`, this.database, config, props);
	}
}
