import { createSalesforceAccountResolver } from '@exogee/graphweaver-salesforce-graphql';

export const salesforceAccount =
	process.env.SALESFORCE_INSTANCE_URL &&
	process.env.SALESFORCE_TOKEN &&
	createSalesforceAccountResolver({
		salesforceInstanceUrl: process.env.SALESFORCE_INSTANCE_URL,
		salesforceToken: process.env.SALESFORCE_TOKEN,
	});
