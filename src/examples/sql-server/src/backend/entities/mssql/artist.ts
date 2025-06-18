import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Album } from './album';

@Entity({ tableName: 'Artist' })
export class Artist {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'integer' })
	artistId!: number;

	@Property({ fieldName: 'Name', type: 'string', length: 120, nullable: true })
	name?: string;

	@OneToMany({ entity: () => Album, mappedBy: 'artist' })
	albums = new Collection<Album>(this);
}
