import { Entity, Field, GraphQLEntity, GraphQLID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';
import { Playlist as OrmPlaylist } from '../entities';
import { connection } from '../database';

@Entity('Playlist', {
	provider: new MikroBackendProvider(OrmPlaylist, connection),
})
export class Playlist extends GraphQLEntity<OrmPlaylist> {
	public dataEntity!: OrmPlaylist;

	@Field(() => GraphQLID)
	id!: number;

	@Field(() => String, { nullable: true, summaryField: true })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'playlists' })
	tracks!: Track[];
}
