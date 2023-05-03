import { createBaseResolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Resolver } from 'type-graphql';

import { User as OrmUser } from '../../entities';
import { User } from './entity';

@Resolver((of) => User)
export class UserResolver extends createBaseResolver<User, OrmUser>(
	User,
	new MikroBackendProvider(OrmUser, 'pg')
) {}
