import { AdminUIFilterType, Entity, ID } from '@exogee/graphweaver';
import { connection } from '../database';
import { Album } from './album';
import { Field, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity('Artist', {
	provider: new SqlDataProvider(() => Artist, connection, { table: 'Artist' }),
})
export class Artist {
	@Field(() => ID, {
		column: 'ArtistId',
		primaryKeyField: true,
		adminUIOptions: { filterType: AdminUIFilterType.DROP_DOWN_TEXT },
	})
	artistId!: number;

	@Field(() => String, {
		column: 'Name',
		nullable: true,
		adminUIOptions: {
			summaryField: true,
			filterOptions: {
				caseInsensitive: true,
				substringMatch: true,
			},
		},
	})
	name?: string;

	@OneToMany(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}
