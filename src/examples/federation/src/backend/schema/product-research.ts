import { Entity, Field, RelationshipField } from '@exogee/graphweaver';

import { CaseStudy } from './case-study';

// type ProductResearch @key(fields: "study { caseNumber }") {
//   study: CaseStudy!
//   outcome: String
// }

@Entity('ProductResearch', {
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class ProductResearch {
	@RelationshipField(() => CaseStudy, { id: 'study' })
	study!: CaseStudy;

	@Field(() => String, { nullable: true })
	outcome?: string;
}
