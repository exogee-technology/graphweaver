import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Fish as OrmFish } from '../../entities';
import { Fish } from './entity';
import { myConnection } from '../../database';

@Resolver((of) => Fish)
export class FishResolver extends createBaseResolver<Fish, OrmFish>(
	Fish,
	new MikroBackendProvider(OrmFish, myConnection)
) {}
