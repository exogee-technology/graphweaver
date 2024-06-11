import { Entity, Field, ID } from '@exogee/graphweaver';

// type CaseStudy {
//   caseNumber: ID!
//   description: String
// }

@Entity('CaseStudy', {
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class CaseStudy {
	@Field(() => ID, { primaryKeyField: true })
	caseNumber!: string;

	@Field(() => String, { nullable: true })
	description?: string;
}
