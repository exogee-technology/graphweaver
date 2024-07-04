import {
	BaseDataProvider,
	Entity,
	Field,
	Filter,
	ID,
	RelationshipField,
} from '@exogee/graphweaver';

import { ProductVariation } from './product-variation';
import { ProductDimension } from './product-dimension';
import { ProductResearch } from './product-research';
import { User } from './user';
import { data } from '../data';
import { HiddenEntity } from './hidden-entity';

class JsonDataProvider extends BaseDataProvider<Product> {
	async findOne(filter: Filter<Product>) {
		const product = data.products.find((product) => product.id === filter.id);
		return product as unknown as Product;
	}
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

@Entity('Product', {
	provider: new JsonDataProvider('Product Management System'),
	apiOptions: { excludeFromBuiltInWriteOperations: true },
	directives: {
		custom: true,
	},
})
export class Product {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@Field(() => String, { nullable: true })
	sku?: string;

	@Field(() => String, { nullable: true })
	package?: string;

	@RelationshipField(() => ProductVariation, { id: 'variation', nullable: true })
	variation?: ProductVariation;

	@RelationshipField(() => ProductDimension, { id: 'dimensions', nullable: true })
	dimensions?: ProductDimension;

	@RelationshipField(() => User, {
		id: 'createdBy',
		nullable: true,
		directives: { provides: { fields: 'totalProductsCreated' } },
	})
	createdBy!: User;

	@Field(() => String, { nullable: true, directives: { tag: { name: 'internal' } } })
	notes?: string;

	@RelationshipField(() => [ProductResearch], { id: 'research' })
	research!: ProductResearch;

	// Because HiddenEntity is excluded from federation, this property should not be included in the schema
	// returned in the _service { sdl } query, but will be visible with standard introspection.
	@RelationshipField(() => [HiddenEntity], { id: 'hiddenEntityId', nullable: true })
	hiddenEntities!: HiddenEntity[];
}
