import { createBaseResolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Resolver } from 'type-graphql';

import { Tag as OrmTag } from '../../entities';
import { Tag } from './entity';

@Resolver((of) => Tag)
export class TagResolver extends createBaseResolver<Tag, OrmTag>(
	Tag,
	new MikroBackendProvider(OrmTag, 'my-sql')
) {}
