import { Entity, ID } from '@exogee/graphweaver';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Track } from './track';
import { connection } from '../database';
import { Field, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('Genre', {
	provider: new SqlDataProvider(() => Genre, connection, { table: 'Genre' }),
})
export class Genre {
	@Field(() => ID, { column: 'GenreId', primaryKeyField: true })
	genreId!: number;

	@Field(() => String, { column: 'Name', nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@OneToMany(() => [Track], { relatedField: 'genre' })
	tracks!: Track[];
}
