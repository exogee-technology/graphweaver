import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { RestBackendProvider } from '@exogee/graphweaver-rest';
import url from 'url';

import { Resolver } from 'type-graphql';

import { People as RestPeople } from '../../entities';
import { Person } from './entity';
import { fetch } from '../../rest-client';

@Resolver((of) => Person)
@AuthorizedBaseFunctions()
export class PersonResolver extends createBaseResolver(
	Person,
	new RestBackendProvider('People', {
		find: async ({ filter, pagination }) => {
			const { results } = await fetch(`/people`);

			for (const person of results) {
				const id = url.parse(person.url).pathname?.split('/')?.[3];
				(person as RestPeople & { id: string }).id = id || 'null';
			}

			return results;
		},
	})
) {}
