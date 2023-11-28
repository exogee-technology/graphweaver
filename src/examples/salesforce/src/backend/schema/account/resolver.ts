import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { AccessorParams, RestBackendProvider } from '@exogee/graphweaver-rest';
import url from 'url';

import { Account as RestAccount } from '../../entities';
import { Account } from './entity';
import { fetch } from '../../rest-client';

@Resolver((of) => Account)
export class AccountResolver extends createBaseResolver<Account, RestAccount>(
	Account,
	new RestBackendProvider('Account', {
		find: async ({ filter }: AccessorParams) => {
			const results = await fetch<RestAccount>(`/people`);
			for (const person of results) {
				const [_, __, id] = (url.parse(person.url).pathname?.split('/') || []).filter(
					(part) => part
				);
				(person as RestAccount & { id: string }).id = id || person.url;
			}

			return results;
		},
	})
) {}
