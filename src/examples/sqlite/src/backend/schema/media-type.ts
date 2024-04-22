import { Entity, Field, GraphQLEntity, GraphQLID, RelationshipField } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { Track } from './track';
import { MediaType as OrmMediaType } from '../entities';
import { connection } from '../database';

@Entity('MediaType', {
	provider: new MikroBackendProvider(OrmMediaType, connection),
})
export class MediaType extends GraphQLEntity<OrmMediaType> {
	public dataEntity!: OrmMediaType;

	@Field(() => GraphQLID)
	id!: number;

	@Field(() => String, { nullable: true, summaryField: true })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'mediaType' })
	tracks!: Track[];
}
