import { Entity, Field } from '../decorators';
import { AdminUiEnumValueMetadata } from './enum-value';

@Entity('AdminUiEnumMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiEnumMetadata {
	@Field(() => String, { directives: { inaccessible: true } })
	name!: string;

	@Field(() => [AdminUiEnumValueMetadata], { directives: { inaccessible: true } })
	values() {
		return [];
	}
}
