import { BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';

import { Skill as OrmSkill } from '../../entities';
import { User } from '../user';

@ObjectType('Skill')
export class Skill extends GraphQLEntity<OrmSkill> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => [User], { nullable: true })
	async users(@Root() skill: Skill) {
		if (!skill.dataEntity.users) return null;
		const users = await BaseLoaders.loadByRelatedId({
			gqlEntityType: User,
			relatedField: 'skills',
			id: skill.id,
		});
		return users.map((user) => User.fromBackendEntity(user));
	}
}
