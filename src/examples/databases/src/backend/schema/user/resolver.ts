import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { User as OrmUser } from '../../entities';
import { User } from './entity';
import { pgConnection } from '../../database';

@Resolver((of) => User)
export class UserResolver extends createBaseResolver<User, OrmUser>(
	User,
	new MikroBackendProvider(OrmUser, pgConnection)
) {}
