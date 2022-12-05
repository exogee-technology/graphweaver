import { createBaseResolver } from '@exogee/graphweaver';
import { XeroBackendProvider } from '@exogee/graphweaver-xero';
import { Resolver } from 'type-graphql';
import { Account } from './entity';

@Resolver((of) => Account)
export class AccountResolver extends createBaseResolver(
	Account,
	new XeroBackendProvider('Account', {
		find: async ({ xero, filter, order }) => {
			const {
				body: { accounts },
			} = await xero.accountingApi.getAccounts(
				'22460aa9-d4f8-4f35-98c5-7e407698ef2b',
				undefined,
				filter,
				order
			);

			return (
				accounts?.map((account) => {
					(account as any).id = account.accountID;
					return account;
				}) || []
			);
		},
	})
) {}
