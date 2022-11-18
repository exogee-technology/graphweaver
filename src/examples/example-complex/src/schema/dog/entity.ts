import { AuthorizeAccess, BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
import { ManyToOne } from '@exogee/graphweaver-rest';
import { Field, ID, ObjectType } from 'type-graphql';

import { Dog as RestDog } from '../../entities';
import { Breeder } from '../breeder';

@ObjectType('Dog')
@AuthorizeAccess({})
export class Dog extends GraphQLEntity<RestDog> {
	public dataEntity!: RestDog;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => String, {})
	breederId?: string;

	@Field(() => Breeder, { nullable: false })
	async breeder() {
		if (!this.breederId) return null;
		const result = await BaseLoaders.loadOne({
			gqlEntityType: Breeder,
			id: this.breederId,
		});
		return Breeder.fromBackendEntity(result);
	}
}
