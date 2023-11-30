import { Resolver } from 'type-graphql';
import { createProvider } from '@exogee/graphweaver-helpers';

import type { ItemWithId } from '@exogee/graphweaver-helpers';
import { createBaseResolver } from '@exogee/graphweaver';
import { getOneAccount, getManyAccounts } from '../util';

import { SalesforceAccount } from './graphQLEntity';
import { SalesforceAccountBackendEntity } from './backendEntity';

type Entity = ItemWithId;
type Context = any;
type DataEntity = any;

export interface SalesforceAccountResolverOptions {
	salesforceInstanceUrl: string;
	salesforceToken: string;
}

export const createSalesforceAccountResolver = ({
	salesforceInstanceUrl,
	salesforceToken,
}: SalesforceAccountResolverOptions) => {
	const provider = createProvider<Entity, Context, DataEntity>({
		backendId: 'Salesforce',
		init: async () => {
			// @todo: authenticate with salesforce
		},
		read: async (context, filter, pagination) => {
			// if (filter?.id) return mapId(await getOneAccount(String(filter.id)));

			// if (Array.isArray(filter?._or))
			// 	return (await getManyAccounts(salesforceInstanceUrl, salesforceToken, filter)).map(mapId);

			return await getManyAccounts(salesforceInstanceUrl, salesforceToken, filter);
		},
	});

	@Resolver((of) => SalesforceAccount)
	class SalesforceAccountResolver extends createBaseResolver<
		SalesforceAccount,
		SalesforceAccountBackendEntity
	>(SalesforceAccount, provider) {}

	return {
		resolver: SalesforceAccountResolver,
		entity: SalesforceAccount,
		provider,
	};
};

export const mapId = (account: any): any => ({
	id: account.Id,
	...account,
});
