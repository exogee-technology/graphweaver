import { Collection } from '@exogee/graphweaver-mikroorm';
import { Field, ObjectType, Root } from 'type-graphql';
import { AdminField } from './admin-field';

@ObjectType('AdminUiMetadata')
export class AdminUiMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String, { nullable: true })
	backendId?: string;

	@Field(() => [AdminField])
	async fields(@Root() adminUiMetadata: AdminUiMetadata) {
		return new Collection<AdminField>(this);
	}
}
