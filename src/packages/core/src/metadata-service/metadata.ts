import { Entity, Field } from '../decorators';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEnumMetadata } from './enum';

@Entity('AdminUiMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { shareable: true },
})
export class AdminUiMetadata {
	@Field(() => [AdminUiEntityMetadata])
	public entities: AdminUiEntityMetadata[] = [];

	@Field(() => [AdminUiEnumMetadata])
	public enums: AdminUiEntityMetadata[] = [];
}
