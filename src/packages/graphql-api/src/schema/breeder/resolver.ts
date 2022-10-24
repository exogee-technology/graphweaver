import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/base-resolver';
import { RestBackendProvider, Breeder as RestBreeder } from '@exogee/rest-entities';
import { Resolver } from 'type-graphql';

import { Breeder } from './entity';

@Resolver((of) => Breeder)
@AuthorizedBaseFunctions()
export class BreederResolver extends createBaseResolver(
	Breeder,
	new RestBackendProvider(RestBreeder, Breeder)
) {}
