import Graphweaver from '@exogee/graphweaver-server';
import { MikroBackendProvider } from '@exogee/graphweaver-mikroorm';

import './schema';

import { traceConnection } from './database';
import { Trace } from './entities';
import { trustedDocuments } from '../trusted-documents.generated';

export const traceProvider = new MikroBackendProvider(Trace, traceConnection);

export const graphweaver = new Graphweaver({
	openTelemetry: {
		traceProvider,
	},

	// Only the operations baked in at build time are accepted, and clients send a hash instead of
	// the operation itself. The allow lists are configured in graphweaver-config.ts.
	//
	// With no `allowList` set, any document in the manifest is allowed, which is plain safelisting.
	// See the rest-with-auth example for giving different clients different lists.
	trustedDocuments: {
		manifest: trustedDocuments,
	},
});
