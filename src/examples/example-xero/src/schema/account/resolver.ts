import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { forEachTenant, offsetAndLimit } from '../../utils';
import { Account } from './entity';
import { Account as XeroAccount } from 'xero-node';

@Resolver((of) => Account)
export class AccountResolver extends createBaseResolver(
	Account,
	new XeroBackendProvider('Account', {
		find: async ({ xero, filter, order, limit, offset }) => {
			const fullSet = await forEachTenant<XeroAccount>(xero, async (tenant) => {
				const {
					body: { accounts },
				} = await xero.accountingApi.getAccounts(tenant.tenantId, undefined, filter, order);

				for (const account of accounts) {
					(account as any).id = account.accountID;
				}

				return accounts;
			});

			return offsetAndLimit(fullSet, offset, limit);
		},
	})
) {}
