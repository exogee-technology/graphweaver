import { AdminUIFilterType } from '@exogee/graphweaver';
import { Field, ObjectType, registerEnumType } from 'type-graphql';

registerEnumType(AdminUIFilterType, { name: 'AdminUiFilterType' });

@ObjectType('AdminUiFilterMetadata')
export class AdminUiFilterMetadata {
	@Field(() => AdminUIFilterType)
	type!: AdminUIFilterType;
}
