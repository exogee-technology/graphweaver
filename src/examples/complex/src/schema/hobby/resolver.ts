import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { RLSMikroBackendProvider } from '@exogee/graphweaver-rls';
import { Resolver } from 'type-graphql';

import { Hobby as OrmHobby } from '../../entities';
import { Hobby } from './entity';

@Resolver((of) => Hobby)
@AuthorizedBaseFunctions()
export class HobbyResolver extends createBaseResolver(
	Hobby,
	new RLSMikroBackendProvider(OrmHobby, Hobby)
) {}
