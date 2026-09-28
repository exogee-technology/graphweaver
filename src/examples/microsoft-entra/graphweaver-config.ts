import { defineConfig, PrimaryAuthMethod } from '@exogee/graphweaver-config';

export default defineConfig({
	adminUI: {
		auth: {
			primaryMethods: [PrimaryAuthMethod.MICROSOFT_ENTRA],
		},
	},

	// The web portal and the mobile app hit the same endpoint, and each is held to its own set of
	// operations. `graphweaver build` hashes each list into the server bundle; at runtime a client
	// sends only the hash, and the server decides which list that request may draw from.
	//
	// Graphweaver adds an `admin-ui` list of its own, holding the documents the Admin UI builds
	// from your schema at runtime, so it keeps working with trusted documents turned on. Projects
	// that pass `adminMetadata: { enabled: false }` to Graphweaver aren't serving the Admin UI, and
	// don't get that list.
	trustedDocuments: {
		allowLists: {
			web: ['src/frontend/web/**/*.graphql'],
			mobile: ['src/frontend/mobile/**/*.graphql'],
		},
	},
});
