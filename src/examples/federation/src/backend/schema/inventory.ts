import { BaseDataProvider, Entity, Field, ID, RelationshipField } from '@exogee/graphweaver';
import { DeprecatedProduct } from './deprecated-product';
import { data } from '../data';

// type Inventory @interfaceObject @key(fields: "id") {
//   id: ID!
//   deprecatedProducts: [DeprecatedProduct!]!

class JsonDataProvider extends BaseDataProvider<Inventory> {
	async findOne() {
		return data.inventory as unknown as Inventory;
	}
}

@Entity('Inventory', {
	provider: new JsonDataProvider('Inventory'),
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { interfaceObject: true },
})
export class Inventory {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;

	@RelationshipField(() => [DeprecatedProduct], { id: 'deprecatedProductId', nullable: true })
	deprecatedProducts!: DeprecatedProduct[];
}
