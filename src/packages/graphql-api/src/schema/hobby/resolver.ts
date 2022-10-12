import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/base-resolver';
import { Hobby as OrmHobby } from '@exogee/database-entities';
import { RLSMikroBackendProvider } from '@exogee/database-provider';
import { Resolver } from 'type-graphql';

import { Hobby } from './entity';

@Resolver((of) => Hobby)
@AuthorizedBaseFunctions()
export class HobbyResolver extends createBaseResolver(
	Hobby,
	new RLSMikroBackendProvider(OrmHobby, Hobby)
) {}
