import { AuthorizeAccess, BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';

import { Breeder as RestBreeder } from '../../entities';
import { Dog } from '../dog';

@ObjectType('Breeder')
//@AuthorizeAccess({})
export class Breeder extends GraphQLEntity<RestBreeder> {
	public dataEntity!: RestBreeder;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => [Dog])
	async dogs(@Root() breeder: Breeder) {
		const dogs = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Dog,
			relatedField: 'breederId',
			id: breeder.id,
		});
		return dogs.map((dog) => Dog.fromBackendEntity(dog));
	}
}
