import { Entity, Field, ID, GraphQLInt, BaseDataProvider } from '@exogee/graphweaver';

// extend type User @key(fields: "email") {
//   averageProductsCreatedPerYear: Int @requires(fields: "totalProductsCreated yearsOfEmployment")
//   email: ID! @external
//   name: String @override(from: "users")
//   totalProductsCreated: Int @external
//   yearsOfEmployment: Int! @external
// }

const user = {
	averageProductsCreatedPerYear: Math.round(1337 / 10),
	email: 'support@apollographql.com',
	name: 'Jane Smith',
	totalProductsCreated: 1337,
	yearsOfEmployment: 10,
};

class JsonDataProvider extends BaseDataProvider<User> {
	findOne(): Promise<User> {
		return Promise.resolve(user);
	}
}

@Entity('User', {
	apiOptions: { excludeFromBuiltInOperations: true },
	provider: new JsonDataProvider('User Management System'),
})
export class User {
	@Field(() => ID, { primaryKeyField: true })
	email!: string;

	@Field(() => String, { nullable: true })
	name?: string;

	@Field(() => GraphQLInt, { nullable: true })
	averageProductsCreatedPerYear?: number;

	@Field(() => GraphQLInt, { nullable: true })
	totalProductsCreated?: number;

	@Field(() => GraphQLInt)
	yearsOfEmployment!: number;
}
