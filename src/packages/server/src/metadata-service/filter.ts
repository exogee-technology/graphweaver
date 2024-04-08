import { AdminUIFilterType, Entity, Field, graphweaverMetadata } from '@exogee/graphweaver';

graphweaverMetadata.collectEnumInformation({
	name: 'AdminUiFilterType',
	target: AdminUIFilterType,
});

@Entity('AdminUiFilterMetadata', { apiOptions: { excludeFromBuiltInOperations: true } })
export class AdminUiFilterMetadata {
	@Field(() => AdminUIFilterType)
	type!: AdminUIFilterType;
}
