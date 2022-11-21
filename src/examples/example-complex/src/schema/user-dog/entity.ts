import { GraphQLEntity, BaseLoaders } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';
import { UserDog as OrmUserDog } from '../../entities/mikroorm/user-dog';
import { Dog } from '../dog';

@ObjectType('UserDog')
export class UserDog extends GraphQLEntity<OrmUserDog> {
	public dataEntity!: OrmUserDog;

	@Field(() => ID)
	id!: string;

	@Field(() => [Dog])
	async dogs(@Root() userDog: UserDog) {
		if (!this.dataEntity.dogId) return null;
		const dogs = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Dog,
			relatedField: 'id',
			id: userDog.dataEntity.dogId,
		});
		return dogs.map((dog) => Dog.fromBackendEntity(dog));
	}
}
