import { Entity, ID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Artist } from './artist';
import { Track } from './track';
import { connection } from '../database';
import { Field, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity<Album>('Album', {
	provider: new SqlDataProvider(() => Album, connection, { table: 'Album' }),
})
export class Album {
	@Field(() => ID, { column: 'AlbumId', primaryKeyField: true })
	albumId!: number;

	@Field(() => String, { column: 'Title', adminUIOptions: { summaryField: true } })
	title!: string;

	@ManyToOne(() => Artist, { column: 'ArtistId' })
	artist!: Artist;

	@OneToMany(() => [Track], { relatedField: 'album' })
	tracks!: Track[];
}
