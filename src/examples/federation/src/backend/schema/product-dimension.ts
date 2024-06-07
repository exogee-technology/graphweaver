import { BaseDataProvider, Entity, Field } from '@exogee/graphweaver';
import { data } from '../data';

// type ProductDimension @shareable {
//   size: String
//   weight: Float
//   unit: String @inaccessible
// }

class JsonDataProvider extends BaseDataProvider<ProductDimension> {
	find(): Promise<ProductDimension[]> {
		return Promise.resolve([data.dimension]);
	}
	findOne(): Promise<ProductDimension> {
		return Promise.resolve(data.dimension);
	}
}

@Entity('ProductDimension', {
	provider: new JsonDataProvider('Product Dimensions'),
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { shareable: true },
})
export class ProductDimension {
	id!: string;

	@Field(() => String, { nullable: true })
	size?: string;

	@Field(() => Number, { nullable: true })
	weight?: number;

	@Field(() => String, { nullable: true, directives: { inaccessible: true } })
	unit?: string;
}
