import { BaseDataProvider, Entity, Field } from '@exogee/graphweaver';
import { data } from '../data';

// type ProductDimension @shareable {
//   size: String
//   weight: Float
//   unit: String @inaccessible
// }

class JsonDataProvider extends BaseDataProvider<ProductDimension> {
	async find() {
		return [data.dimension];
	}
	async findOne() {
		return data.dimension;
	}
}

@Entity('ProductDimension', {
	provider: new JsonDataProvider('Product Dimensions'),
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
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
