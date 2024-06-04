import { Entity, Field, ID, GraphQLInt } from '@exogee/graphweaver';

// extend type User @key(fields: "email") {
//   averageProductsCreatedPerYear: Int @requires(fields: "totalProductsCreated yearsOfEmployment")
//   email: ID! @external
//   name: String @override(from: "users")
//   totalProductsCreated: Int @external
//   yearsOfEmployment: Int! @external
// }

@Entity('User', {
	apiOptions: { excludeFromBuiltInOperations: true },
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
