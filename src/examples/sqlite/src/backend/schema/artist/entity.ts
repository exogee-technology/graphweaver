import {
	Field,
	GraphQLEntity,
	ID,
	ObjectType,
	RelationshipField,
	SummaryField,
} from '@exogee/graphweaver';
import { Album } from '../album';
import { Artist as OrmArtist } from '../../entities';

@ObjectType('Artist')
export class Artist extends GraphQLEntity<OrmArtist> {
	public dataEntity!: OrmArtist;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String, { nullable: true })
	name?: string;

	@RelationshipField<Album>(() => [Album], { relatedField: 'artist' })
	albums!: Album[];
}
