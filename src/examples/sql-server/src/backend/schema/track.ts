import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Album } from './album';
import { Genre } from './genre';
import { InvoiceLine } from './invoice-line';
import { MediaType } from './media-type';
import { Playlist } from './playlist';
import { Track as OrmTrack } from '../entities';
import { connection } from '../database';

@Entity<Track>('Track', {
	provider: new MikroBackendProvider(OrmTrack, connection, { backendDisplayName: 'SQL Server' }),
})
export class Track {
	@Field(() => ID, { primaryKeyField: true })
	trackId!: number;

	@Field(() => String, { adminUIOptions: {summaryField:true} })
	name!: string;

	@RelationshipField<Track>(() => Album, { id: (entity) => entity.album?.albumId, nullable: true })
	album?: Album;

	@RelationshipField<Track>(() => MediaType, { id: (entity) => entity.mediaType?.mediaTypeId })
	mediaType!: MediaType;

	@RelationshipField<Track>(() => Genre, { id: (entity) => entity.genre?.genreId, nullable: true })
	genre?: Genre;

	@Field(() => String, { nullable: true })
	composer?: string;

	@Field(() => Number)
	milliseconds!: number;

	@Field(() => Number, { nullable: true })
	bytes?: number;

	@Field(() => String)
	unitPrice!: string;

	@RelationshipField<InvoiceLine>(() => [InvoiceLine], { relatedField: 'track' })
	invoiceLines!: InvoiceLine[];

	@RelationshipField<Playlist>(() => [Playlist], { relatedField: 'tracks' })
	playlists!: Playlist[];
}
