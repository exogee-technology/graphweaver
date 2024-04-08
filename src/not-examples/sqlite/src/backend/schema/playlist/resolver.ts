import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Playlist } from './entity';
import { Playlist as OrmPlaylist } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Playlist)
export class PlaylistResolver extends createBaseResolver<Playlist, OrmPlaylist>(
	Playlist,
	new MikroBackendProvider(OrmPlaylist, connection)
) {}
