import { Field, GraphQLEntity, ID, ObjectType, RelationshipField, SummaryField } from '@exogee/graphweaver';
import { Track } from '../track';
import { Playlist as OrmPlaylist } from '../../entities';

@ObjectType('Playlist')
export class Playlist extends GraphQLEntity<OrmPlaylist> {
	public dataEntity!: OrmPlaylist;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String, { nullable: true })
	name?: string;

	@RelationshipField<Track>(() => [Track], { relatedField: 'playlists' })
	tracks!: Track[];
}
