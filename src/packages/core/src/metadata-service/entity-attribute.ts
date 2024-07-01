import { Entity, Field } from '../decorators';

@Entity('AdminUiEntityAttributeMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiEntityAttributeMetadata {
	@Field(() => Boolean, { nullable: true, directives: { inaccessible: true } })
	isReadOnly?: boolean;

	@Field(() => Number, { nullable: true, directives: { inaccessible: true } })
	exportPageSize?: number;
}
