import Graphweaver from '@exogee/graphweaver-server';
import './schema';

import { trustedDocuments } from '../trusted-documents.generated';

// Declared alongside the entity now, rather than constructed here.
export { traceProvider } from './schema/trace';
import { traceProvider } from './schema/trace';

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
