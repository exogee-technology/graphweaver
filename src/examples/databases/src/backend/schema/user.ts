import { GraphQLEntity, Field, GraphQLID, Entity, Filter } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { User as OrmUser } from '../entities';
import { pgConnection } from '../database';

@Entity<User>('User', {
	provider: new MikroBackendProvider(OrmUser, pgConnection),
	adminUIOptions: {
		defaultFilter: { deleted: false },
		summaryField: 'username',
	},
})
export class User extends GraphQLEntity<OrmUser> {
	public dataEntity!: OrmUser;

	@Field(() => GraphQLID)
	id!: string;

	@Field(() => String)
	username!: string;

	@Field(() => String)
	email!: string;

	@Field(() => Boolean)
	deleted!: boolean;
}
