import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import { Entity, Field } from '../decorators';
import { graphweaverMetadata } from '../metadata.js';
import { AdminUIFilterType } from '../types';

graphweaverMetadata.collectEnumInformation({
	name: 'AdminUiFilterType',
	target: AdminUIFilterType,
});

@Entity('AdminUiFilterMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true, excludeFromFederation: true },
})
export class AdminUiFilterMetadata {
	@Field(() => AdminUIFilterType)
	type!: AdminUIFilterType;

	@Field(() => GraphQLJSON, { nullable: true })
	options?: Record<string, unknown>;
}
