import { GraphQLEntity, BaseLoaders } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';

import { User as OrmUser } from '../../entities';
import { Hobby } from '../hobby';
import { Skill } from '../skill';
import { UserDog } from '../user-dog';

@ObjectType('User')
export class User extends GraphQLEntity<OrmUser> {
	public dataEntity!: OrmUser;

	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => [Hobby])
	async hobbies(@Root() user: User) {
		if (!user.dataEntity) return null;
		const hobbies = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Hobby,
			relatedField: 'user',
			id: user.dataEntity.id,
		});
		return hobbies.map((hobby) => Hobby.fromBackendEntity(hobby));
	}

	@Field(() => [Skill])
	async skills(@Root() user: User) {
		const skills = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Skill,
			relatedField: 'users',
			id: user.id,
		});
		return skills.map((skill) => Skill.fromBackendEntity(skill));
	}

	@Field(() => [UserDog])
	async userDogs(@Root() user: User) {
		if (!user.dataEntity.id) return null;
		const userDogs = await BaseLoaders.loadByRelatedId({
			gqlEntityType: UserDog,
			relatedField: 'user',
			id: user.dataEntity.id,
		});
		return userDogs.map((userDog) => UserDog.fromBackendEntity(userDog));
	}
}
