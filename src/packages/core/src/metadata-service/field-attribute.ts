import { Entity, Field } from '../decorators';
import { AdminUIFilterType } from '../types';

@Entity('AdminUiFieldAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiFieldAttributeMetadata {
	@Field(() => Boolean)
	isReadOnly!: boolean;

	@Field(() => Boolean)
	isRequired!: boolean;

	@Field(() => AdminUIFilterType)
	filterType!: AdminUIFilterType;
}
