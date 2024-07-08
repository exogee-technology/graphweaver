import { Entity, Field } from '../decorators';
import { AdminUiEntityMetadata } from './entity';
import { AdminUiEnumMetadata } from './enum';

@Entity('AdminUiMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiMetadata {
	@Field(() => [AdminUiEntityMetadata])
	public entities: AdminUiEntityMetadata[] = [];

	@Field(() => [AdminUiEnumMetadata])
	public enums: AdminUiEnumMetadata[] = [];

	@Field(() => String, { nullable: true })
	public federationSubgraphName?: string;
}
