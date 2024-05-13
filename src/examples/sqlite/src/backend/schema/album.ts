import { Entity, Field, GraphQLEntity, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Artist } from './artist';
import { Track } from './track';
import { Album as OrmAlbum } from '../entities';
import { connection } from '../database';

@Entity('Album', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
})
export class Album extends GraphQLEntity<OrmAlbum> {
	public dataEntity!: OrmAlbum;

	@Field(() => ID, { primaryKeyField: true })
	albumId!: number;

	@Field(() => String, { adminUIOptions: { summaryField: true } })
	title!: string;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.artistId })
	artist!: Artist;

	@RelationshipField<Track>(() => [Track], { relatedField: 'album' })
	tracks!: Track[];
}
