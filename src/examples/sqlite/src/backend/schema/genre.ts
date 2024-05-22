import { Entity, Field, GraphQLEntity, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';
import { Genre as OrmGenre } from '../entities';
import { connection } from '../database';

@Entity('Genre', {
	provider: new MikroBackendProvider(OrmGenre, connection),
})
export class Genre extends GraphQLEntity<OrmGenre> {
	public dataEntity!: OrmGenre;

	@Field(() => ID)
	id!: number;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'genre' })
	tracks!: Track[];
}
