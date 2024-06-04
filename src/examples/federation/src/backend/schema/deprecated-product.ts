import { Entity, Field, RelationshipField, graphweaverMetadata } from '@exogee/graphweaver';
import { User } from './user';

// type DeprecatedProduct @key(fields: "sku package") {
//   sku: String!
//   package: String!
//   reason: String
//   createdBy: User
// }

@Entity('DeprecatedProduct', {
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class DeprecatedProduct {
	@Field(() => String, { primaryKeyField: true })
	sku!: string;

	@Field(() => String)
	package!: string;

	@Field(() => String, { nullable: true })
	reason?: string;

	@RelationshipField(() => User, { id: 'createdBy', nullable: true })
	createdBy!: User;
}

// extend type Query {
//   product(id: ID!): Product
//   deprecatedProduct(sku: String!, package: String!): DeprecatedProduct @deprecated(reason: "Use product query instead")
// }

graphweaverMetadata.addQuery({
	name: 'deprecatedProduct',
	intentionalOverride: true,
	args: {
		sku: String,
		package: String,
	},
	getType: () => DeprecatedProduct,
	resolver: () => true,
});
