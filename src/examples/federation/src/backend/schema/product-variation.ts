import { Entity, Field, ID } from '@exogee/graphweaver';

// type ProductVariation {
//   id: ID!
// }

@Entity('ProductVariation', {
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class ProductVariation {
	@Field(() => ID, { primaryKeyField: true })
	id!: string;
}
