import { Entity, Field } from '../decorators';

@Entity('AdminUiEntityAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiEntityAttributeMetadata {
	@Field(() => Boolean, { nullable: true })
	isReadOnly?: boolean;

	@Field(() => Number, { nullable: true })
	exportPageSize?: number;

	@Field(() => Boolean, { nullable: true })
	clientGeneratedPrimaryKeys?: boolean;
}
