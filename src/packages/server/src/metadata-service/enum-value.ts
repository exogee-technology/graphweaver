import { Entity, Field } from '@exogee/graphweaver';

@Entity('AdminUiEnumValueMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiEnumValueMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	value!: string;
}
