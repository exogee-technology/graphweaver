module.exports = {
	adminUI: {
		auth: {
			primaryMethods: ['MICROSOFT_ENTRA'],
		},
	},

	// The web portal and the mobile app hit the same endpoint, and each is held to its own set of
	// operations. `graphweaver build` hashes each list into the server bundle; at runtime a client
	// sends only the hash, and the server decides which list that request may draw from.
	//
	// Graphweaver adds an `admin-ui` list of its own, holding the documents the Admin UI builds
	// from your schema at runtime, so it keeps working with trusted documents turned on.
	trustedDocuments: {
		allowLists: {
			web: ['src/frontend/web/**/*.graphql'],
			mobile: ['src/frontend/mobile/**/*.graphql'],
		},
	},
};
