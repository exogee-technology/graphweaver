import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';
import { Playlist as OrmPlaylist } from '../entities';
import { connection } from '../database';

@Entity('Playlist', {
	provider: new MikroBackendProvider(OrmPlaylist, connection),
})
export class Playlist {
	@Field(() => ID, { primaryKeyField: true })
	playlistId!: number;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'playlists' })
	tracks!: Track[];
}
