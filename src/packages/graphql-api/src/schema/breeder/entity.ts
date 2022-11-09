import { AuthorizeAccess, BaseLoaders, GraphQLEntity } from '@exogee/base-resolver';
import { Breeder as RestBreeder } from './entity';
import { Field, ID, ObjectType, Root } from 'type-graphql';

import { Dog } from '../dog';

@ObjectType('Breeder')
@AuthorizeAccess({})
export class Breeder extends GraphQLEntity<RestBreeder> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => [Dog])
	async dogs(@Root() breeder: Breeder) {
		const d = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Dog,
			relatedField: 'breeder',
			id: breeder.id,
		});
		return d.map((dog) => Dog.fromBackendEntity(dog));
	}
}
