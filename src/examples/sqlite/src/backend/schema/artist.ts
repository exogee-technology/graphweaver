import { AdminUIFilterType, Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { connection } from '../database';
import { Artist as OrmArtist } from '../entities';
import { Album } from './album';

@Entity('Artist', {
	provider: new MikroBackendProvider(OrmArtist, connection),
})
export class Artist {
	@Field(() => ID, {
		primaryKeyField: true,
		adminUIOptions: { filterType: AdminUIFilterType.DROP_DOWN_TEXT },
	})
	artistId!: number;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}
