import { GraphQLEntity, BaseLoaders } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';
import { UserDog as OrmUserDog } from '../../entities/mikroorm/user-dog';
import { Dog } from '../dog';
import { User } from '../user';

@ObjectType('UserDog')
export class UserDog extends GraphQLEntity<OrmUserDog> {
	public dataEntity!: OrmUserDog;

	@Field(() => ID)
	id!: string;

	@Field(() => [Dog])
	async dogs(@Root() userDog: UserDog) {
		if (!this.dataEntity.restDogId) return null;
		const dogs = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Dog,
			relatedField: 'id',
			id: userDog.dataEntity.restDogId,
		});
		return dogs.map((dog) => Dog.fromBackendEntity(dog));
	}

	@Field(() => [User])
	async users(@Root() userDog: UserDog) {
		if (!this.dataEntity.user) return null;
		const users = await BaseLoaders.loadByRelatedId({
			gqlEntityType: User,
			relatedField: 'id',
			id: this.dataEntity.user.id,
		});
		return users.map((user) => User.fromBackendEntity(user));
	}
}
