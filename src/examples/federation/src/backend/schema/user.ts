import { Entity, Field, ID, GraphQLInt, BaseDataProvider } from '@exogee/graphweaver';
import { data } from '../data';

// extend type User @key(fields: "email") {
//   averageProductsCreatedPerYear: Int @requires(fields: "totalProductsCreated yearsOfEmployment")
//   email: ID! @external
//   name: String @override(from: "users")
//   totalProductsCreated: Int @external
//   yearsOfEmployment: Int! @external
// }

class JsonDataProvider extends BaseDataProvider<User> {
	find(): Promise<User[]> {
		return Promise.resolve([data.user]);
	}
	findOne(): Promise<User> {
		return Promise.resolve(data.user);
	}
}

@Entity('User', {
	apiOptions: { excludeFromBuiltInOperations: true },
	provider: new JsonDataProvider('User Management System'),
})
export class User {
	@Field(() => ID, { primaryKeyField: true, directives: { external: true } })
	email!: string;

	@Field(() => String, { nullable: true, directives: { override: { from: 'users' } } })
	name?: string;

	@Field(() => GraphQLInt, {
		nullable: true,
		directives: { requires: { fields: 'totalProductsCreated yearsOfEmployment' } },
	})
	averageProductsCreatedPerYear?: number;

	@Field(() => GraphQLInt, { nullable: true, directives: { external: true } })
	totalProductsCreated?: number;

	@Field(() => GraphQLInt, { directives: { external: true } })
	yearsOfEmployment!: number;
}
