import { GraphQLJSON } from '@exogee/graphweaver-scalars';

import { AdminUiFieldMetadata } from './field';
import { AdminUiEntityAttributeMetadata } from './entity-attribute';
import { Entity, Field } from '../decorators';
import { AggregationType, Filter } from '../types';
import { graphweaverMetadata } from '..';

graphweaverMetadata.collectEnumInformation({
	target: AggregationType,
	name: 'AggregationType',
});

@Entity('AdminUiEntityMetadata', {
	apiOptions: { excludeFromBuiltInOperations: true },
	directives: { inaccessible: true },
})
export class AdminUiEntityMetadata {
	@Field(() => String)
	name!: string;

	@Field(() => String)
	plural!: string;

	@Field(() => String, { nullable: true })
	backendId?: string | null;

	@Field(() => String, { nullable: true })
	summaryField?: string | null;

	@Field(() => String)
	primaryKeyField!: string;

	@Field(() => [AdminUiFieldMetadata])
	fields?: AdminUiFieldMetadata[] = [];

	@Field(() => GraphQLJSON, { nullable: true })
	defaultFilter?: Filter<unknown>;

	@Field(() => AdminUiEntityAttributeMetadata)
	attributes?: AdminUiEntityAttributeMetadata;

	@Field(() => [AggregationType])
	supportedAggregationTypes!: AggregationType[];
}
