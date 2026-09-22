import { defineConfig } from '@exogee/graphweaver-config';

export default defineConfig({
	// Every operation the web front end can send lives in these files. `graphweaver build` hashes
	// them into the server bundle, and the API then only accepts those hashes.
	//
	// Graphweaver adds an `admin-ui` list of its own, holding the documents the Admin UI sends, so
	// it keeps working with trusted documents turned on. Projects that pass
	// `adminMetadata: { enabled: false }` to Graphweaver aren't serving the Admin UI, and don't get
	// that list.
	trustedDocuments: {
		allowLists: {
			web: ['src/frontend/web/**/*.graphql'],
		},
	},
});
