import { Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Track } from './track';
import { MediaType as OrmMediaType } from '../entities';
import { connection } from '../database';

@ApplyAccessControlList({
	Everyone: {
		read: true,
	},
})
@Entity('MediaType', {
	provider: new MikroBackendProvider(OrmMediaType, connection),
})
export class MediaType {
	@Field(() => ID, { primaryKeyField: true })
	mediaTypeId!: number;

	@Field(() => String, { nullable: true, adminUIOptions: { summaryField: true } })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'mediaType' })
	tracks!: Track[];
}
