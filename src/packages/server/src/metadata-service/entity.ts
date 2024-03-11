import { Field, ObjectType } from 'type-graphql';
import { GraphQLJSON } from '@exogee/graphweaver-scalars';
import { Filter } from '@exogee/graphweaver';

import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityAttributeMetadata } from './entity-attribute';

@ObjectType('AdminUiEntityMetadata')
export class AdminUiEntityMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	plural!: string;

	@Field(() => String, { nullable: true })
	backendId?: string | null;

	@Field(() => String, { nullable: true })
	summaryField?: string | null;

	@Field(() => [AdminUiFieldMetadata])
	fields?: AdminUiFieldMetadata[] = [];

	@Field(() => GraphQLJSON, { nullable: true })
	defaultFilter?: Filter<unknown>;

	@Field(() => AdminUiEntityAttributeMetadata)
	attributes?: AdminUiEntityAttributeMetadata;
}
