import { Entity, ID } from '@exogee/graphweaver';
import { Album } from './album';
import { connection } from '../database';
import { Field, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity<Artist>('Artist', {
	provider: new SqlDataProvider(() => Artist, connection, {
		table: 'Artist',
		backendDisplayName: 'SQL Server',
	}),
})
export class Artist {
	@Field(() => ID, { column: 'ArtistId', primaryKeyField: true })
	artistId!: number;

	@Field(() => String, { column: 'Name', nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@OneToMany(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}
