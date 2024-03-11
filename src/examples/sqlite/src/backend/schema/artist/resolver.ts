import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Artist } from './entity';
import { Artist as OrmArtist } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Artist)
export class ArtistResolver extends createBaseResolver<Artist, OrmArtist>(
	Artist,
	new MikroBackendProvider(OrmArtist, connection)
) {}
