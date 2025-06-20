import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Track } from './track';

@Entity({ tableName: 'Genre' })
export class Genre {
	@PrimaryKey({ fieldName: 'GenreId', type: 'integer' })
	genreId!: number;

	@Property({ fieldName: 'Name', type: 'string', length: 120, nullable: true })
	name?: string;

	@OneToMany({ entity: () => Track, mappedBy: 'genre' })
	tracks = new Collection<Track>(this);
}
