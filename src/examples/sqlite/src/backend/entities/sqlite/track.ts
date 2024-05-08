import { Collection, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Album } from './album';
import { Genre } from './genre';
import { InvoiceLine } from './invoice-line';
import { MediaType } from './media-type';
import { Playlist } from './playlist';

@Entity({ tableName: 'Track' })
export class Track extends BaseEntity {
	@PrimaryKey({ fieldName: 'TrackId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(200)' })
	name!: unknown;

	@ManyToOne({ entity: () => Album, ref: true, fieldName: 'AlbumId', nullable: true, index: 'IFK_TrackAlbumId' })
	album?: Ref<Album>;

	@ManyToOne({ entity: () => MediaType, ref: true, fieldName: 'MediaTypeId', index: 'IFK_TrackMediaTypeId' })
	mediaType!: Ref<MediaType>;

	@ManyToOne({ entity: () => Genre, ref: true, fieldName: 'GenreId', nullable: true, index: 'IFK_TrackGenreId' })
	genre?: Ref<Genre>;

	@Property({ fieldName: 'Composer', type: 'NVARCHAR(220)', nullable: true })
	composer?: unknown;

	@Property({ fieldName: 'Milliseconds', type: 'number' })
	milliseconds!: number;

	@Property({ fieldName: 'Bytes', type: 'number', nullable: true })
	bytes?: number;

	@Property({ fieldName: 'UnitPrice', type: 'NUMERIC(10,2)' })
	unitPrice!: string;

	@OneToMany({ entity: () => InvoiceLine, mappedBy: 'track' })
	invoiceLines = new Collection<InvoiceLine>(this);

	@ManyToMany({ entity: () => Playlist, mappedBy: 'tracks' })
	playlists = new Collection<Playlist>(this);
}
