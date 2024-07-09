import {
	BaseDataProvider,
	Entity,
	Field,
	RelationshipField,
	graphweaverMetadata,
} from '@exogee/graphweaver';
import { User } from './user';
import { data } from '../data';

class JsonDataProvider extends BaseDataProvider<DeprecatedProduct> {
	async find() {
		return [data.deprecatedProduct] as unknown as DeprecatedProduct[];
	}
	async findOne() {
		return data.deprecatedProduct as unknown as DeprecatedProduct;
	}
}

// type DeprecatedProduct @key(fields: "sku package") {
//   sku: String!
//   package: String!
//   reason: String
//   createdBy: User
// }

@Entity('DeprecatedProduct', {
	provider: new JsonDataProvider('Deprecated Products'),
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
		sku: {
			type: () => String,
			nullable: false,
		},
		package: {
			type: () => String,
			nullable: false,
		},
	},
	getType: () => DeprecatedProduct,
	resolver: async () => true,
});
