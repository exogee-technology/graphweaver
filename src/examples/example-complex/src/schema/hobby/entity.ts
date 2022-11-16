import { BaseLoaders, GraphQLEntity } from '@exogee/graphweaver';
import { Field, ID, ObjectType, Root } from 'type-graphql';
import { Hobby as OrmHobby } from '../../entities';
import { User } from '../user';

@ObjectType('Hobby')
export class Hobby extends GraphQLEntity<OrmHobby> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => User, { nullable: true })
	async user(@Root() hobby: Hobby) {
		if (!hobby.dataEntity.user) return null;
		return User.fromBackendEntity(
			await BaseLoaders.loadOne({
				gqlEntityType: User,
				id: hobby.dataEntity.user.unwrap().id,
			})
		);
	}
}
