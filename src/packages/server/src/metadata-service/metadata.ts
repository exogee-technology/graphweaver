import { Entity, Field } from '@exogee/graphweaver';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEnumMetadata } from './enum';

@Entity('AdminUiMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiMetadata {
	@Field(() => [AdminUiEntityMetadata])
	public entities: AdminUiEntityMetadata[] = [];

	@Field(() => [AdminUiEnumMetadata])
	public enums: AdminUiEntityMetadata[] = [];
}
