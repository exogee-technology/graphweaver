import { AdminUIFilterType, Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { connection } from '../database';
import { Album as OrmAlbum } from '../entities';
import { Artist } from './artist';
import { Track } from './track';

@Entity<Album>('Album', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
})
export class Album {
	@Field(() => ID, {
		primaryKeyField: true,
		adminUIOptions: { filterType: AdminUIFilterType.DROP_DOWN_TEXT },
	})
	albumId!: number;

	@Field(() => String, {
		adminUIOptions: {
			summaryField: true,
			filterType: AdminUIFilterType.DROP_DOWN_TEXT,
			filterOptions: { substringMatch: true, caseInsensitive: true },
		},
	})
	title!: string;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.artistId })
	artist!: Artist;

	@RelationshipField<Track>(() => [Track], { relatedField: 'album' })
	tracks!: Track[];
}
