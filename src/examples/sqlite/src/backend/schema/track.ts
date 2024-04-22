import { Entity, Field, GraphQLEntity, GraphQLID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Album } from './album';
import { Genre } from './genre';
import { InvoiceLine } from './invoice-line';
import { MediaType } from './media-type';
import { Playlist } from './playlist';
import { Track as OrmTrack } from '../entities';
import { connection } from '../database';

@Entity('Track', {
	provider: new MikroBackendProvider(OrmTrack, connection),
})
export class Track extends GraphQLEntity<OrmTrack> {
	public dataEntity!: OrmTrack;

	@Field(() => GraphQLID)
	id!: number;

	@Field(() => String, { summaryField: true })
	name!: string;

	@RelationshipField<Track>(() => Album, { id: (entity) => entity.album?.id, nullable: true })
	album?: Album;

	@RelationshipField<Track>(() => MediaType, { id: (entity) => entity.mediaType?.id })
	mediaType!: MediaType;

	@RelationshipField<Track>(() => Genre, { id: (entity) => entity.genre?.id, nullable: true })
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
