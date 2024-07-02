import { Entity, Field } from '../decorators';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEnumMetadata } from './enum';

@Entity('AdminUiMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiMetadata {
	@Field(() => [AdminUiEntityMetadata], { directives: { inaccessible: true } })
	public entities: AdminUiEntityMetadata[] = [];

	@Field(() => [AdminUiEnumMetadata], { directives: { inaccessible: true } })
	public enums: AdminUiEnumMetadata[] = [];
}
