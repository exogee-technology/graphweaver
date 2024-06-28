import { Entity, Field } from '../decorators';
import { ID, Sort } from '../types';

import {
	GraphQLJSON,
	GraphQLNanoTimestamp,
	GraphQLNanoDuration,
} from '@exogee/graphweaver-scalars';

export const addTraceEntityToSchema = () => {
	// We are applying the decorators to the Trace class here if tracing is enabled.
	Field(() => ID)(Trace.prototype, 'id');
	Field(() => String, { adminUIOptions: { hideInFilterBar: true, hideInTable: true } })(
		Trace.prototype,
		'spanId'
	);
	Field(() => String, {
		nullable: true,
		adminUIOptions: { hideInFilterBar: true, hideInTable: true },
	})(Trace.prototype, 'parentId');
	Field(() => String)(Trace.prototype, 'name');
	Field(() => GraphQLNanoTimestamp, { adminUIOptions: { hideInFilterBar: true } })(
		Trace.prototype,
		'timestamp'
	);
	Field(() => GraphQLNanoDuration, { adminUIOptions: { hideInFilterBar: true } })(
		Trace.prototype,
		'duration'
	);
	Field(() => String)(Trace.prototype, 'traceId');
	Field(() => GraphQLJSON, { adminUIOptions: { hideInFilterBar: true, hideInTable: true } })(
		Trace.prototype,
		'attributes'
	);

	Entity<Trace>('Trace', {
		adminUIOptions: {
			readonly: true,
			hideInSideBar: true,
			fieldForDetailPanel: 'traceId',
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
	})(Trace);
};

export class Trace {
	id!: string;
	spanId!: string;
	parentId?: string | null;
	name!: string;
	timestamp!: bigint;
	duration!: bigint;
	traceId!: string;
	attributes!: Record<string, unknown>;
}
