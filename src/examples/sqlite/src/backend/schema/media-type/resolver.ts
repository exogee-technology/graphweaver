import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { MediaType } from './entity';
import { MediaType as OrmMediaType } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => MediaType)
export class MediaTypeResolver extends createBaseResolver<MediaType, OrmMediaType>(
	MediaType,
	new MikroBackendProvider(OrmMediaType, connection)
) {}
