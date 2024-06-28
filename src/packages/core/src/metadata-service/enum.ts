import { Entity, Field } from '../decorators';
import { AdminUiEnumValueMetadata } from './enum-value';

@Entity('AdminUiEnumMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { shareable: true },
})
export class AdminUiEnumMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => [AdminUiEnumValueMetadata])
	values() {
		return [];
	}
}
