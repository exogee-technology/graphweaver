import Graphweaver from '@exogee/graphweaver-server';

import './auth';
import './schema';

import { trustedDocuments } from '../trusted-documents.generated';

export const graphweaver = new Graphweaver({
	// One endpoint, but each client is confined to its own list of operations, so the API behaves
	// as though the web portal and the mobile app were separate services.
	//
	// The list is chosen per request rather than per user, and that distinction is the point: a
	// user who can read customers in the web portal still cannot read them through the mobile app,
	// because the app identifies itself and gets the mobile list whatever token it carries.
	trustedDocuments: {
		manifest: trustedDocuments,
		allowList: ({ headers }) => {
			if (headers.get('x-client') === 'mobile') return 'mobile';
			if (headers.get('x-client') === 'admin') return 'admin-ui';
			return 'web';
		},
	},
});
