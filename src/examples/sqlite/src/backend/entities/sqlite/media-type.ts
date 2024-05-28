import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Track } from './track';

@Entity({ tableName: 'MediaType' })
export class MediaType {
	@PrimaryKey({ fieldName: 'MediaTypeId', type: 'number' })
	mediaTypeId!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: string;

	@OneToMany({ entity: () => Track, mappedBy: 'mediaType' })
	tracks = new Collection<Track>(this);
}
