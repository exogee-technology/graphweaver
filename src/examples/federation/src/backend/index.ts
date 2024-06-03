import Graphweaver from '@exogee/graphweaver-server';
import { BaseDataProvider, Entity, Field, ID } from '@exogee/graphweaver';

// type Product = {
// 	id: String;
// 	sku: String;
// 	package: String;
// 	variation: ProductVariation;
// 	dimensions: ProductDimension;
// 	createdBy: User;
// 	notes: String;
// 	research: [ProductResearch!]!
// }

class JsonDataProvider extends BaseDataProvider<Product> {}

@Entity('Product', {
	provider: new JsonDataProvider('Product Management System'),
})
export class Product {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String)
	sku!: string;

	@Field(() => String)
	package!: string;

	@Field(() => String)
	notes!: string;
}

// type Product @custom @key(fields: "id") @key(fields: "sku package") @key(fields: "sku variation { id }") {
//   id: ID!
//   sku: String
//   package: String
//   variation: ProductVariation
//   dimensions: ProductDimension
//   createdBy: User @provides(fields: "totalProductsCreated")
//   notes: String @tag(name: "internal")
//   research: [ProductResearch!]!
// }

// type DeprecatedProduct @key(fields: "sku package") {
//   sku: String!
//   package: String!
//   reason: String
//   createdBy: User
// }

// type ProductVariation {
//   id: ID!
// }

// type ProductResearch @key(fields: "study { caseNumber }") {
//   study: CaseStudy!
//   outcome: String
// }

// type CaseStudy {
//   caseNumber: ID!
//   description: String
// }

// type ProductDimension @shareable {
//   size: String
//   weight: Float
//   unit: String @inaccessible
// }

// extend type Query {
//   product(id: ID!): Product
//   deprecatedProduct(sku: String!, package: String!): DeprecatedProduct @deprecated(reason: "Use product query instead")
// }

// extend type User @key(fields: "email") {
//   averageProductsCreatedPerYear: Int @requires(fields: "totalProductsCreated yearsOfEmployment")
//   email: ID! @external
//   name: String @override(from: "users")
//   totalProductsCreated: Int @external
//   yearsOfEmployment: Int! @external
// }

// type Inventory @interfaceObject @key(fields: "id") {
//   id: ID!
//   deprecatedProducts: [DeprecatedProduct!]!

export const graphweaver = new Graphweaver();

export const handler = graphweaver.handler();
