import { Field, ID, Entity } from '@exogee/graphweaver';
import {
	AccessControlList,
	ApplyAccessControlList,
	AuthorizationContext,
} from '@exogee/graphweaver-auth';
import { AccessorParams, RestBackendProvider, inMemoryFilterFor } from '@exogee/graphweaver-rest';
import url from 'url';

import { fetch } from '../rest-client';
import { User as RestUser } from '../entities';

const provider = new RestBackendProvider('User', {
	find: async ({ filter }: AccessorParams) => {
		const results = await fetch<RestUser>(`/people`);

		for (const person of results) {
			const [_, __, id] = (url.parse(person.url).pathname?.split('/') || []).filter((part) => part);
			(person as RestUser & { id: string }).id = id || person.url;
		}

		if (filter) {
			const memoryFilter = inMemoryFilterFor(filter);
			return results.filter(memoryFilter);
		}

		return results;
	},
});

const acl: AccessControlList<User, AuthorizationContext> = {
	LIGHT_SIDE: {
		// Users can only perform operations on their own tasks
		all: (context) => ({ id: context.user?.id }),
	},
	DARK_SIDE: {
		// Dark side user role can perform operations on any tasks
		all: true,
	},
};

@ApplyAccessControlList(acl)
@Entity('User', { provider })
export class User {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;
}
