import { Entity, Field } from '@exogee/graphweaver';

// type ProductDimension @shareable {
//   size: String
//   weight: Float
//   unit: String @inaccessible
// }

@Entity('ProductDimension', {
	apiOptions: { excludeFromBuiltInOperations: true },
})
export class ProductDimension {
	@Field(() => String, { nullable: true })
	size?: string;

	@Field(() => Number, { nullable: true })
	weight?: number;

	@Field(() => String, { nullable: true })
	unit?: string;
}
