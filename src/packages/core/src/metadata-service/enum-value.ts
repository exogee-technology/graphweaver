import { Entity, Field } from '../decorators';

@Entity('AdminUiEnumValueMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiEnumValueMetadata {
	@Field(() => String, { directives: { inaccessible: true } })
	name!: string;

	@Field(() => String, { directives: { inaccessible: true } })
	value!: string;
}
