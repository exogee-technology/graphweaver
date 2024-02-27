import {
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	RelationshipField,
	SummaryField,
} from '@exogee/graphweaver';
import { Track } from '../track';
import { MediaType as OrmMediaType } from '../../entities';

@ObjectType('MediaType')
export class MediaType extends GraphQLEntity<OrmMediaType> {
	public dataEntity!: OrmMediaType;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String, { nullable: true })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'mediaType' })
	tracks!: Track[];
}
