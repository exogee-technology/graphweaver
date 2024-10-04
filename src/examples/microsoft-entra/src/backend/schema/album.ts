import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Artist } from './artist';
import { Track } from './track';
import { Album as OrmAlbum } from '../entities';
import { connection } from '../database';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity<Album>('Album', {
	provider: new MikroBackendProvider(OrmAlbum, connection),
})
export class Album {
	@Field(() => ID, { primaryKeyField: true })
	albumId!: number;

	@Field(() => String, { adminUIOptions: { summaryField: true } })
	title!: string;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.artistId })
	artist!: Artist;

	@RelationshipField<Track>(() => [Track], { relatedField: 'album' })
	tracks!: Track[];
}
