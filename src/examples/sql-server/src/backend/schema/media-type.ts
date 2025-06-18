import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';
import { MediaType as OrmMediaType } from '../entities';
import { connection } from '../database';

@Entity<MediaType>('MediaType', {
	provider: new MikroBackendProvider(OrmMediaType, connection, { backendDisplayName: 'SQL Server' }),
})
export class MediaType {
	@Field(() => ID, { primaryKeyField: true })
	mediaTypeId!: number;

	@Field(() => String, { nullable: true, adminUIOptions: {summaryField:true} })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'mediaType' })
	tracks!: Track[];
}
