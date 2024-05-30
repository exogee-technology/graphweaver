import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Track } from './track';

@Entity({ tableName: 'Genre' })
export class Genre {
	@PrimaryKey({ fieldName: 'GenreId', type: 'number' })
	genreId!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: string;

	@OneToMany({ entity: () => Track, mappedBy: 'genre' })
	tracks = new Collection<Track>(this);
}
