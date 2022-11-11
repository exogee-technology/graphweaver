import { AuthorizeAccess, GraphQLEntity } from '@exogee/base-resolver';
import { Dog as RestDog, RestBackendProvider } from '@exogee/rest-entities';
import { Field, ID, ObjectType } from 'type-graphql';
import { Breeder } from '../breeder';
import { Breeder as RestBreeder } from '@exogee/rest-entities';

@ObjectType('Dog')
@AuthorizeAccess({})
export class Dog extends GraphQLEntity<RestDog> {
	@Field(() => ID)
	id!: string;

	@Field(() => String)
	name!: string;

	@Field(() => Breeder, { nullable: true })
	async breeder() {
		if (!this.dataEntity.breederId) return null;
		const provider = new RestBackendProvider(RestBreeder, Breeder);
		const response = await provider.findOne(this.dataEntity.breederId);
		if (response === null) return null;

		console.log(response);
		return response;
		// const data = JSON.parse(response);
		// console.log(data);
		// return data;

		// const x = {
		// 	id: .id,
		// 	name: b.dataEntity.name,
		// };
		// console.log(b);
		// // Breeder {
		// // 	[2]   dataEntity: '{\n  "id": "1",\n  "name": "Awesome Kennels"\n}',
		// // 	[2]   id: undefined,
		// // 	[2]   name: undefined
		// // 	[2] }
		// return b;
	}
}
