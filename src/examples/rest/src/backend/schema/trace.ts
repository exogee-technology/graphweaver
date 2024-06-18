import { Entity, Field } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Trace as OrmTrace } from '../entities';
import { myConnection } from '../database';

export const traceProvider = new MikroBackendProvider(OrmTrace, myConnection);

@ApplyAccessControlList({
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
})
@Entity('Trace', {
	provider: traceProvider,
	adminUIOptions: {
		hideInSideBar: true,
	},
	apiOptions: {
		excludeFromBuiltInWriteOperations: true,
	},
})
export class TraceEntity {
	@Field(() => String)
	id!: string;

	@Field(() => String)
	traceId!: string;

	@Field(() => String, { nullable: true })
	parentId?: string;

	@Field(() => String)
	name!: string;

	@Field(() => String)
	timestamp!: string;

	@Field(() => String)
	duration!: string;
}
