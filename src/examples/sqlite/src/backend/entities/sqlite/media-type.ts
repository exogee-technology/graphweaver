import { Collection, Entity, OneToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';

@Entity({ tableName: 'MediaType' })
export class MediaType extends BaseEntity {
	@PrimaryKey({ fieldName: 'MediaTypeId', type: 'number' })
	mediaTypeId!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: unknown;

	@OneToMany({ entity: () => Track, mappedBy: 'mediaType' })
	tracks = new Collection<Track>(this);
}
