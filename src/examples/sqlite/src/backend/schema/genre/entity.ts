import { Field, GraphQLEntity, ID, ObjectType, RelationshipField, SummaryField } from '@exogee/graphweaver';
import { Track } from '../track';
import { Genre as OrmGenre } from '../../entities';

@ObjectType('Genre')
export class Genre extends GraphQLEntity<OrmGenre> {
	public dataEntity!: OrmGenre;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String, { nullable: true })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'genre' })
	tracks!: Track[];
}
