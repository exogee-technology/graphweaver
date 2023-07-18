import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import { Tag as OrmTag } from '../../entities';
import { Tag } from './entity';
import { myConnection } from '../../database';

@Resolver((of) => Tag)
export class TagResolver extends createBaseResolver<Tag, OrmTag>(
	Tag,
	new MikroBackendProvider(OrmTag, myConnection)
) {}
