import { Entity, Field } from '../decorators';
import { ID, Sort } from '../types';

import {
	GraphQLJSON,
	GraphQLNanoTimestamp,
	GraphQLNanoDuration,
} from '@exogee/graphweaver-scalars';

@Entity<TraceEntity>('Trace', {
	adminUIOptions: {
		readonly: true,
		hideInSideBar: true,
		defaultFilter: {
			parentId: null,
			name_nin: ['GraphweaverMetadata', 'TracesList', 'trace', 'IntrospectionQuery'],
		},
		defaultSort: {
			timestamp: Sort.DESC,
		},
	},
	apiOptions: {
		excludeFromBuiltInWriteOperations: true,
	},
})
export class TraceEntity {
	@Field(() => ID)
	id!: string;

	@Field(() => String, { adminUIOptions: { hideInFilterBar: true, hideInTable: true } })
	spanId!: string;

	@Field(() => String, {
		nullable: true,
		adminUIOptions: { hideInFilterBar: true, hideInTable: true },
	})
	parentId?: string | null;

	@Field(() => String)
	name!: string;

	@Field(() => GraphQLNanoTimestamp, { adminUIOptions: { hideInFilterBar: true } })
	timestamp!: bigint;

	@Field(() => GraphQLNanoDuration, { adminUIOptions: { hideInFilterBar: true } })
	duration!: bigint;

	@Field(() => String)
	traceId!: string;

	@Field(() => GraphQLJSON, { adminUIOptions: { hideInFilterBar: true, hideInTable: true } })
	attributes!: Record<string, unknown>;
}
