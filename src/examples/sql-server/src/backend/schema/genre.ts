import { Entity, ID } from '@exogee/graphweaver';
import { Track } from './track';
import { connection } from '../database';
import { Field, OneToMany, SqlDataProvider } from '@exogee/graphweaver-sql';

@Entity<Genre>('Genre', {
	provider: new SqlDataProvider(() => Genre, connection, {
		table: 'Genre',
		backendDisplayName: 'SQL Server',
	}),
})
export class Genre {
	@Field(() => ID, { column: 'GenreId', primaryKeyField: true })
	genreId!: number;

	@Field(() => String, { column: 'Name', nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@OneToMany(() => [Track], { relatedField: 'genre' })
	tracks!: Track[];
}
