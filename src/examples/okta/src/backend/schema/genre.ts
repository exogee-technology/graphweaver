import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Track } from './track';
import { Genre as OrmGenre } from '../entities';
import { connection } from '../database';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('Genre', {
	provider: new MikroBackendProvider(OrmGenre, connection),
})
export class Genre {
	@Field(() => ID, { primaryKeyField: true })
	genreId!: number;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'genre' })
	tracks!: Track[];
}
