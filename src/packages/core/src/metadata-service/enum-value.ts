import { Entity, Field } from '../decorators';

@Entity('AdminUiEnumValueMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiEnumValueMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	value!: string;
}
