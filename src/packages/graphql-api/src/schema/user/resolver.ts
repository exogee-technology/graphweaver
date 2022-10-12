import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/base-resolver';
import { User as OrmUser } from '@exogee/database-entities';
import { RLSMikroBackendProvider } from '@exogee/database-provider';
import { Resolver } from 'type-graphql';

import { User } from './entity';

@Resolver((of) => User)
@AuthorizedBaseFunctions()
export class UserResolver extends createBaseResolver(
	User,
	new RLSMikroBackendProvider(OrmUser, User)
) {}
