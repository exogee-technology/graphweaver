import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Resolver } from 'type-graphql';

import { User as OrmUser } from '../../entities';
import { User } from './entity';

@Resolver((of) => User)
@AuthorizedBaseFunctions()
export class UserResolver extends createBaseResolver(User, new MikroBackendProvider(OrmUser)) {}
