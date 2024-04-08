import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Album } from './entity';
import { Album as OrmAlbum } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Album)
export class AlbumResolver extends createBaseResolver<Album, OrmAlbum>(
	Album,
	new MikroBackendProvider(OrmAlbum, connection)
) {}
