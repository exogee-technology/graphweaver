import { Entity, ID } from '@exogee/graphweaver';
import { Album } from './album';
import { Genre } from './genre';
import { InvoiceLine } from './invoice-line';
import { MediaType } from './media-type';
import { Playlist } from './playlist';
import { connection } from '../database';
import { Field, ManyToMany, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity<Track>('Track', {
	provider: new SqlDataProvider(() => Track, connection, {
		table: 'Track',
		backendDisplayName: 'SQL Server',
	}),
})
export class Track {
	@Field(() => ID, { column: 'TrackId', primaryKeyField: true })
	trackId!: number;

	@Field(() => String, { column: 'Name', adminUIOptions: { summaryField: true } })
	name!: string;

	@ManyToOne(() => Album, { column: 'AlbumId', nullable: true })
	album?: Album;

	@ManyToOne(() => MediaType, { column: 'MediaTypeId' })
	mediaType!: MediaType;

	@ManyToOne(() => Genre, { column: 'GenreId', nullable: true })
	genre?: Genre;

	@Field(() => String, { column: 'Composer', nullable: true })
	composer?: string;

	@Field(() => Number, { column: 'Milliseconds' })
	milliseconds!: number;

	@Field(() => Number, { column: 'Bytes', nullable: true })
	bytes?: number;

	@Field(() => String, { column: 'UnitPrice' })
	unitPrice!: string;

	@OneToMany(() => [InvoiceLine], { relatedField: 'track' })
	invoiceLines!: InvoiceLine[];

	@ManyToMany(() => [Playlist], { relatedField: 'tracks' })
	playlists!: Playlist[];
}
