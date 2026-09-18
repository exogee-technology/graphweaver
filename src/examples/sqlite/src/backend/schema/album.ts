import { AdminUIFilterType, Entity, ID } from '@exogee/graphweaver';
import { connection } from '../database';
import { Artist } from './artist';
import { Track } from './track';
import { Field, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity<Album>('Album', {
	provider: new SqlDataProvider(() => Album, connection, { table: 'Album' }),
})
export class Album {
	@Field(() => ID, {
		column: 'AlbumId',
		primaryKeyField: true,
		adminUIOptions: { filterType: AdminUIFilterType.DROP_DOWN_TEXT },
	})
	albumId!: number;

	@Field(() => String, {
		column: 'Title',
		adminUIOptions: {
			summaryField: true,
			filterType: AdminUIFilterType.DROP_DOWN_TEXT,
		},
	})
	title!: string;

	@ManyToOne(() => Artist, { column: 'ArtistId' })
	artist!: Artist;

	@OneToMany(() => [Track], { relatedField: 'album' })
	tracks!: Track[];
}
