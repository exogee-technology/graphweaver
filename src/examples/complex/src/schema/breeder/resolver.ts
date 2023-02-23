import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { RestBackendProvider } from '@exogee/graphweaver-rest';
import { Resolver } from 'type-graphql';

import { Breeder as RestBreeder } from '../../entities';
import { Breeder } from './entity';

@Resolver((of) => Breeder)
@AuthorizedBaseFunctions()
export class BreederResolver extends createBaseResolver(
	Breeder,
	new RestBackendProvider(RestBreeder, Breeder)
) {}
