import { Trace } from '@exogee/graphweaver';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';
import { ApplyAccessControlList } from '@exogee/graphweaver-auth';

import { Trace as OrmTrace } from '../entities';
import { myConnection } from '../database';

export const traceProvider = new MikroBackendProvider(OrmTrace, myConnection);

ApplyAccessControlList({
	DARK_SIDE: {
		// Dark side user role can perform operations on any tag
		all: true,
	},
})(Trace);
