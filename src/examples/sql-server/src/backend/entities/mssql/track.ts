import { Collection, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Album } from './album';
import { Genre } from './genre';
import { InvoiceLine } from './invoice-line';
import { MediaType } from './media-type';
import { Playlist } from './playlist';

@Entity({ tableName: 'Track' })
export class Track {
	@PrimaryKey({ fieldName: 'TrackId', type: 'integer' })
	trackId!: number;

	@Property({ fieldName: 'Name', type: 'string', length: 200 })
	name!: string;

	@ManyToOne({ entity: () => Album, ref: true, fieldName: 'AlbumId', nullable: true, index: 'IFK_TrackAlbumId' })
	album?: Ref<Album>;

	@ManyToOne({ entity: () => MediaType, ref: true, fieldName: 'MediaTypeId', index: 'IFK_TrackMediaTypeId' })
	mediaType!: Ref<MediaType>;

	@ManyToOne({ entity: () => Genre, ref: true, fieldName: 'GenreId', nullable: true, index: 'IFK_TrackGenreId' })
	genre?: Ref<Genre>;

	@Property({ fieldName: 'Composer', type: 'string', length: 220, nullable: true })
	composer?: string;

	@Property({ fieldName: 'Milliseconds', type: 'integer' })
	milliseconds!: number;

	@Property({ fieldName: 'Bytes', type: 'integer', nullable: true })
	bytes?: number;

	@Property({ fieldName: 'UnitPrice', type: 'decimal' })
	unitPrice!: string;

	@OneToMany({ entity: () => InvoiceLine, mappedBy: 'track' })
	invoiceLines = new Collection<InvoiceLine>(this);

	@ManyToMany({ entity: () => Playlist, mappedBy: 'tracks' })
	playlists = new Collection<Playlist>(this);
}
