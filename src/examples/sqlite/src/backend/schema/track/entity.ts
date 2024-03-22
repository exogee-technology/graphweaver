import {
	AdminUISettings,
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	RelationshipField,
	SummaryField,
} from '@exogee/graphweaver';
import { Album } from '../album';
import { Genre } from '../genre';
import { InvoiceLine } from '../invoice-line';
import { MediaType } from '../media-type';
import { Playlist } from '../playlist';
import { Track as OrmTrack } from '../../entities';

@ObjectType('Track')
export class Track extends GraphQLEntity<OrmTrack> {
	public dataEntity!: OrmTrack;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String)
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
	// This as a string for precision, but it's a number in the database
	unitPrice!: string;

	@RelationshipField<InvoiceLine>(() => [InvoiceLine], { relatedField: 'track' })
	invoiceLines!: InvoiceLine[];

	@AdminUISettings({ hideFromDisplay: true })
	@RelationshipField<Playlist>(() => [Playlist], { relatedField: 'tracks' })
	playlists!: Playlist[];
}
