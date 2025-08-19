import type { DateTimeFormat } from '../decorators';
import { Entity, Field } from '../decorators';

@Entity('AdminUiFieldFormatMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiFieldFormatMetadata {
	@Field(() => String, { nullable: false })
	type!: 'date' | 'currency';

	@Field(() => String, { nullable: true })
	timezone?: string;

	@Field(() => String, { nullable: true })
	format?: DateTimeFormat;

	@Field(() => String, { nullable: true })
	variant?: string;
}
