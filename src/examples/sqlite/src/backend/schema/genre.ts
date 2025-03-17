import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';
import { Genre as OrmGenre } from '../entities';
import { connection } from '../database';

@Entity('Genre', {
	provider: new MikroBackendProvider(OrmGenre, connection),
	apiOptions: { clientGeneratedPrimaryKeys: true },
})
export class Genre {
	@Field(() => ID, { primaryKeyField: true })
	genreId!: number;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'genre' })
	tracks!: Track[];
}
