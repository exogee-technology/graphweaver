import { Entity, Field, ID, Sort } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';
import {
	GraphQLJSON,
	GraphQLNanoTimestamp,
	GraphQLNanoDuration,
} from '@exogee/graphweaver-scalars';

import { Trace as OrmTrace } from '../entities';
import { myConnection } from '../database';

export const traceProvider = new MikroBackendProvider(OrmTrace, myConnection);

@ApplyAccessControlList({
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
})
@Entity<TraceEntity>('Trace', {
	provider: traceProvider,
	adminUIOptions: {
		readonly: true,
		hideInSideBar: true,
		defaultFilter: {
			parentId: null,
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
	parentId?: string;

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