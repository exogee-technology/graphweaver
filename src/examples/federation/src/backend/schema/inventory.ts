import { Entity, Field, ID } from '@exogee/graphweaver';
import { DeprecatedProduct } from './deprecated-product';

// type Inventory @interfaceObject @key(fields: "id") {
//   id: ID!
//   deprecatedProducts: [DeprecatedProduct!]!

@Entity('Inventory', {
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class Inventory {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	// @Field(() => DeprecatedProduct)
	// deprecatedProducts!: DeprecatedProduct;
}
