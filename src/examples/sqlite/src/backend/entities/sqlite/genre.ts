import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';

@Entity({ tableName: 'Genre' })
export class Genre extends BaseEntity {
	@PrimaryKey({ fieldName: 'GenreId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: unknown;

	@OneToMany({ entity: () => Track, mappedBy: 'genre' })
	tracks = new Collection<Track>(this);
}
