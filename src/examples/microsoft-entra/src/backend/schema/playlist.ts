import { Entity, ID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Track } from './track';
import { connection } from '../database';
import { Field, ManyToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('Playlist', {
	provider: new SqlDataProvider(() => Playlist, connection, { table: 'Playlist' }),
})
export class Playlist {
	@Field(() => ID, { column: 'PlaylistId', primaryKeyField: true })
	playlistId!: number;

	@Field(() => String, { column: 'Name', nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@ManyToMany(() => [Track], {
		relatedField: 'playlists',
		through: { table: 'PlaylistTrack', joinColumn: 'PlaylistId', inverseJoinColumn: 'TrackId' },
	})
	tracks!: Track[];
}
