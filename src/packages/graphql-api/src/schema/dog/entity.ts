import { AuthorizeAccess, GraphQLEntity } from '@exogee/base-resolver';
import { Dog as RestDog } from './entity';
import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType('Dog')
@AuthorizeAccess({})
export class Dog extends GraphQLEntity<RestDog> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;
}
