import { AuthorizedBaseFunctions, createBaseResolver } from '@exogee/graphweaver';
import { RestBackendProvider } from '@exogee/graphweaver-rest';
import { Resolver } from 'type-graphql';

import { Dog as RestDog } from '../../entities';
import { Dog } from './entity';

@Resolver((of) => Dog)
@AuthorizedBaseFunctions()
export class DogResolver extends createBaseResolver(Dog, new RestBackendProvider(RestDog, Dog)) {}
