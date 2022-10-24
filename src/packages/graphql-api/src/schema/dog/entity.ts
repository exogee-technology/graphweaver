import { AuthorizeAccess, BaseLoaders, GraphQLEntity } from '@exogee/base-resolver';
import { Dog as RestDog } from './entity';
import { Field, ID, ObjectType } from 'type-graphql';
import { Breeder } from '../breeder';

@ObjectType('Dog')
@AuthorizeAccess({})
export class Dog extends GraphQLEntity<RestDog> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => Breeder, { nullable: false })
	async breeder() {
		if (!this.dataEntity.breeder) return Promise.reject();
		return Breeder.fromBackendEntity(
			await BaseLoaders.loadOne({
				gqlEntityType: Breeder,
				id: '1', //dog.dataEntity.breeder.id,
			})
		);
	}
}
