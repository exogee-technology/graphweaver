import { createBaseResolver } from '@exogee/graphweaver';
import { AccessorParams, RestBackendProvider } from '@exogee/graphweaver-rest';
import url from 'url';
import { Resolver } from 'type-graphql';

import { User as RestUser } from '../../entities';
import { User } from './entity';
import { fetch } from '../../rest-client';
import { inMemoryFilterFor } from '../../utils';

@Resolver((of) => User)
export class UserResolver extends createBaseResolver<User, RestUser>(
	User,
	new RestBackendProvider('User', {
		find: async ({ filter }: AccessorParams) => {
			const { results } = await fetch<RestUser>(`/people`);

			for (const person of results) {
				const [_, __, id] = (url.parse(person.url).pathname?.split('/') || []).filter(
					(part) => part
				);
				(person as RestUser & { id: string }).id = id || person.url;
			}

			if (filter) {
				const memoryFilter = inMemoryFilterFor(filter);
				return results.filter(memoryFilter);
			}

			return results;
		},
	})
) {}
