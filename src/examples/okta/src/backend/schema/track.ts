import { Entity, ID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Album } from './album';
import { Genre } from './genre';
import { InvoiceLine } from './invoice-line';
import { MediaType } from './media-type';
import { Playlist } from './playlist';
import { connection } from '../database';
import { Field, ManyToMany, ManyToOne, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('Track', {
	provider: new SqlDataProvider(() => Track, connection, { table: 'Track' }),
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

	// This is a many-to-many relationship, and takes a long time to load so we hide it from the table in the admin UI
	@ManyToMany(() => [Playlist], {
		relatedField: 'tracks',
		adminUIOptions: { hideInFilterBar: true, hideInTable: true },
	})
	playlists!: Playlist[];
}
