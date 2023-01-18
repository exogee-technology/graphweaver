import { createBaseResolver, Sort } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { forEachTenant, offsetAndLimit, orderByToString } from '../../utils';
import { Account } from './entity';
import { Account as XeroAccount } from 'xero-node';

const defaultSort: Record<string, Sort> = { ['name']: Sort.ASC };

@Resolver((of) => Account)
export class AccountResolver extends createBaseResolver(
	Account,
	new XeroBackendProvider('Account', {
		find: async ({ xero, filter, order, limit, offset }) => {
			const sortFields = order ?? defaultSort;
			const fullSet = await forEachTenant<XeroAccount>(xero, async (tenant) => {
				const {
					body: { accounts },
				} = await xero.accountingApi.getAccounts(
					tenant.tenantId,
					undefined,
					filter,
					orderByToString(sortFields)
				);

				for (const account of accounts) {
					(account as any).id = account.accountID;
				}

				return accounts;
			});

			// filter -> order -> limit/offset
			return offsetAndLimit(fullSet, offset, limit);
		},
	})
) {}
