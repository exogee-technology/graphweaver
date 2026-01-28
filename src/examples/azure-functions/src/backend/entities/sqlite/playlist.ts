import { Collection, Entity, ManyToMany, PrimaryKey, Property } from '@mikro-orm/core';
import { Track } from './track';

@Entity({ tableName: 'Playlist' })
export class Playlist {
	@PrimaryKey({ fieldName: 'PlaylistId', type: 'number' })
	playlistId!: number;

	@Property({ fieldName: 'Name', type: 'NVARCHAR(120)', nullable: true })
	name?: string;

	@ManyToMany({
		entity: () => Track,
		pivotTable: 'PlaylistTrack',
		joinColumn: 'PlaylistId',
		inverseJoinColumn: 'TrackId',
	})
	tracks = new Collection<Track>(this);
}
