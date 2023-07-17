import { BigIntType, Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { BaseEntity } from '@exogee/graphweaver-mikroorm';

@Entity({ tableName: 'Album' })
export class Album extends BaseEntity {
	@PrimaryKey({ type: BigIntType, fieldName: 'AlbumId' })
	id!: string;

	@Property({ type: String })
	Title!: string;
}
