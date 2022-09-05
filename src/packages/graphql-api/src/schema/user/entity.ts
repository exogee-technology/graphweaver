import { GraphQLEntity, BaseLoaders } from '@exogee/base-resolver';
import { User as OrmUser } from '@exogee/database-entities';
import { Field, ID, ObjectType, Root } from 'type-graphql';

import { Hobby } from '../hobby';
import { Skill } from '../skill';

@ObjectType('User')
export class User extends GraphQLEntity<OrmUser> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => [Hobby])
	async hobbies(@Root() user: User) {
		const hobbies = await BaseLoaders.loadByRelatedId({
			gqlEntityType: Hobby,
			relatedField: 'user',
			id: user.id,
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
}
