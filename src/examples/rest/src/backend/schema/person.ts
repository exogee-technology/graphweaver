import { Entity, Field, ID } from '@exogee/graphweaver';
import { AccessorParams, RestBackendProvider, inMemoryFilterFor } from '@exogee/graphweaver-rest';

import { Person as RestPerson } from '../entities';
import { fetch } from '../rest-client';

@Entity('Person', {
	adminUIOptions: { readonly: true },
	apiOptions: { excludeFromBuiltInWriteOperations: true },
	provider: new RestBackendProvider('Person', {
		find: async ({ filter }: AccessorParams) => {
			const results = await fetch<RestPerson>(`/people`);

			for (const person of results) {
				const [_, __, id] = (new URL(person.url).pathname.split('/') || []).filter((part) => part);
				(person as { id: string }).id = id || person.url;
			}

			if (filter) return results.filter(inMemoryFilterFor(filter));

			return results;
		},
	}),
})
export class Person {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => String)
	height!: string;

	@Field(() => String)
	mass!: string;

	@Field(() => String)
	hair_color!: string;

	@Field(() => String)
	birth_year!: string;
}
