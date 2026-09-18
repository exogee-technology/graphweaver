import { Entity, ID } from '@exogee/graphweaver';
import { Artist } from './artist';
import { Track } from './track';
import { connection } from '../database';
import { Field, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity<Album>('Album', {
	provider: new SqlDataProvider(() => Album, connection, {
		table: 'Album',
		backendDisplayName: 'SQL Server',
	}),
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
