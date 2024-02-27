import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Album } from './album';

@Entity({ tableName: 'Artist' })
export class Artist extends BaseEntity {
	@PrimaryKey({ fieldName: 'ArtistId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: string;

	@OneToMany({ entity: () => Album, mappedBy: 'artist' })
	albums = new Collection<Album>(this);
}
