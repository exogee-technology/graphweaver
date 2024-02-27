import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';

@Entity({ tableName: 'Playlist' })
export class Playlist extends BaseEntity {
	@PrimaryKey({ fieldName: 'PlaylistId', type: 'number' })
	id!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: unknown;

	@ManyToMany({ entity: () => Track, pivotTable: 'PlaylistTrack', joinColumn: 'PlaylistId', inverseJoinColumn: 'TrackId' })
	tracks = new Collection<Track>(this);
}
