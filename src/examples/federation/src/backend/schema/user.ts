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
	async find(): Promise<User[]> {
		return [data.user];
	}
	async findOne(): Promise<User> {
		return data.user;
	}
}

@Entity('User', {
	apiOptions: { excludeFromBuiltInOperations: true },
	provider: new JsonDataProvider('User Management System'),
	directives: {
		extends: true,
	},
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
