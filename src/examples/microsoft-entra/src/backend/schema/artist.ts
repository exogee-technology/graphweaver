import { Entity, ID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Album } from './album';
import { connection } from '../database';
import { Field, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('Artist', {
	provider: new SqlDataProvider(() => Artist, connection, { table: 'Artist' }),
})
export class Artist {
	@Field(() => ID, { column: 'ArtistId', primaryKeyField: true })
	artistId!: number;

	@Field(() => String, { column: 'Name', nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@OneToMany(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}
