import { GraphQLEntity, Field, ID, ObjectType } from '@exogee/graphweaver';

import { Album as OrmAlbum } from '../../entities';

@ObjectType('Album')
export class Album extends GraphQLEntity<OrmAlbum> {
	public dataEntity!: OrmAlbum;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	Title!: string;
}
