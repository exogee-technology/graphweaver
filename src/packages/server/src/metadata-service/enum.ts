import { Entity, Field } from '@exogee/graphweaver';
import { AdminUiEnumValueMetadata } from './enum-value';

@Entity('AdminUiEnumMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiEnumMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => [AdminUiEnumValueMetadata])
	values() {
		return [];
	}
}
