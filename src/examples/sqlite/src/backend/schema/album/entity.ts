import { Field, GraphQLEntity, ID, ObjectType, RelationshipField, SummaryField } from '@exogee/graphweaver';
import { Artist } from '../artist';
import { Track } from '../track';
import { Album as OrmAlbum } from '../../entities';

@ObjectType('Album')
export class Album extends GraphQLEntity<OrmAlbum> {
	public dataEntity!: OrmAlbum;

	@Field(() => ID)
	id!: number;

	@SummaryField()
	@Field(() => String)
	title!: string;

	@RelationshipField<Album>(() => Artist, { id: (entity) => entity.artist?.id })
	artist!: Artist;

	@RelationshipField<Track>(() => [Track], { relatedField: 'album' })
	tracks!: Track[];
}
