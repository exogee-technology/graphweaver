import { Entity, Field } from '../decorators';
import { AdminUIFilterType } from '../types';

@Entity('AdminUiEntityAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiEntityAttributeMetadata {
	@Field(() => Boolean, { nullable: true })
	isReadOnly?: boolean;

	@Field(() => AdminUIFilterType, { nullable: true })
	filterType?: AdminUIFilterType;

	@Field(() => Number, { nullable: true })
	exportPageSize?: number;

	@Field(() => Boolean, { nullable: true })
	clientGeneratedPrimaryKeys?: boolean;
}
