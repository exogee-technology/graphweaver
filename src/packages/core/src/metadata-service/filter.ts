import { Entity, Field } from '../decorators';
import { graphweaverMetadata } from '../metadata';
import { AdminUIFilterType } from '../types';

graphweaverMetadata.collectEnumInformation({
	name: 'AdminUiFilterType',
	target: AdminUIFilterType,
});

@Entity('AdminUiFilterMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiFilterMetadata {
	@Field(() => AdminUIFilterType, { directives: { inaccessible: true } })
	type!: AdminUIFilterType;
}
