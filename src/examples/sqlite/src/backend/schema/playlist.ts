import { Entity, Field, GraphQLEntity, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';
import { Playlist as OrmPlaylist } from '../entities';
import { connection } from '../database';

@Entity('Playlist', {
	provider: new MikroBackendProvider(OrmPlaylist, connection),
})
export class Playlist extends GraphQLEntity<OrmPlaylist> {
	public dataEntity!: OrmPlaylist;

	@Field(() => ID)
	id!: number;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'playlists' })
	tracks!: Track[];
}