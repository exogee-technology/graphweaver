import { createBaseResolver, Resolver } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './entity';
import { Track as OrmTrack } from '../../entities';
import { connection } from '../../database';

@Resolver((of) => Track)
export class TrackResolver extends createBaseResolver<Track, OrmTrack>(
	Track,
	new MikroBackendProvider(OrmTrack, connection)
) {}
