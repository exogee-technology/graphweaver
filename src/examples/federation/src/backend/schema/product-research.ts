import { BaseDataProvider, Entity, Field, Filter, RelationshipField } from '@exogee/graphweaver';

import { CaseStudy } from './case-study';
import { data } from '../data';

class JsonDataProvider extends BaseDataProvider<ProductResearch> {
	findOne(filter: Filter<ProductResearch>): Promise<ProductResearch> {
		const product = data.productsResearch.find((product) => product.productId === filter.productId);
		return Promise.resolve(product) as any;
	}
}

// type ProductResearch @key(fields: "study { caseNumber }") {
//   study: CaseStudy!
//   outcome: String
// }

@Entity('ProductResearch', {
	provider: new JsonDataProvider('Product Research'),
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class ProductResearch {
	productId!: string;

	@RelationshipField(() => CaseStudy, { id: 'study' })
	study!: CaseStudy;

	@Field(() => String, { nullable: true })
	outcome?: string;
}
