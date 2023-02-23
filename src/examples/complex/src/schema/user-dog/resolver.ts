import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Resolver } from 'type-graphql';

import { UserDog as OrmUserDog } from '../../entities/mikroorm/user-dog';
import { UserDog } from './entity';

@Resolver((of) => UserDog)
@AuthorizedBaseFunctions()
export class UserDogResolver extends createBaseResolver(
	UserDog,
	new MikroBackendProvider(OrmUserDog)
) {}
