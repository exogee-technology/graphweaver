import { Collection, Entity, ManyToOne, OneToMany, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Artist } from './artist';
import { Track } from './track';

@Entity({ tableName: 'Album' })
export class Album extends BaseEntity {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Title', type: 'NVARCHAR(160)' })
	title!: unknown;

	@ManyToOne({ entity: () => Artist, ref: true, fieldName: 'ArtistId', index: 'IFK_AlbumArtistId' })
	artist!: Ref<Artist>;

	@OneToMany({ entity: () => Track, mappedBy: 'album' })
	tracks = new Collection<Track>(this);
}
