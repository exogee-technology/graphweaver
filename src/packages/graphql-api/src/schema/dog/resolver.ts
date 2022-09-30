import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/base-resolver';
import { RestBackendProvider, Dog as RestDog } from '@exogee/rest-provider';
import { Resolver } from 'type-graphql';

import { Dog } from './entity';

@Resolver((of) => Dog)
@AuthorizedBaseFunctions()
export class DogResolver extends createBaseResolver(
	Dog,
	new RestBackendProvider(RestDog, Dog)
) {}
