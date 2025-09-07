import {
	Collection,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryKey,
	Property,
	Ref,
} from '@mikro-orm/core';
import { Artist } from './artist';
import { Track } from './track';

@Entity({ tableName: 'Album', forceConstructor: true })
export class Album {
	@PrimaryKey({ fieldName: 'AlbumId', type: 'number' })
	albumId!: number;

	@Property({ fieldName: 'Title', type: 'NVARCHAR(160)' })
	title!: string;

	@ManyToOne({ entity: () => Artist, ref: true, fieldName: 'ArtistId', index: 'IFK_AlbumArtistId' })
	artist!: Ref<Artist>;

	@OneToMany({ entity: () => Track, mappedBy: 'album' })
	tracks = new Collection<Track>(this);
}
