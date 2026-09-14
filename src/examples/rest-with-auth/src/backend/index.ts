import Graphweaver from '@exogee/graphweaver-server';
import { AuthorizationContext } from '@exogee/graphweaver-auth';

import './auth';
import './schema';

import { Roles } from './auth/roles';

import { traceProvider } from './schema/trace';
import { trustedDocuments } from '../trusted-documents.generated';

export const graphweaver = new Graphweaver<AuthorizationContext>({
	fileAutoGenerationOptions: {
		typesOutputPath: ['./'],
	},
	openTelemetry: {
		traceProvider,
		instrumentations: [],
	},

	// One endpoint, but each client is held to its own list of operations, so the API behaves as
	// though the web portal and the mobile app were separate services.
	//
	// The list is chosen per request, not per user. That distinction is the point: a user who
	// signed in to the web portal with a magic link still cannot run web-only operations through
	// the mobile app, because the app identifies itself and gets the mobile list either way.
	trustedDocuments: {
		manifest: trustedDocuments,
		allowList: ({ context, headers }) => {
			// The Admin UI builds its documents from your schema at runtime; the build bakes the
			// same ones into this list.
			if (context.user?.roles?.includes(Roles.DARK_SIDE)) return 'admin-ui';

			// Anything presenting itself as the mobile app is confined to the mobile list, whatever
			// credentials it happens to be carrying.
			if (headers.get('x-client') === 'mobile') return 'mobile';

			return 'web';
		},
	},
});
