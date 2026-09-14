module.exports = {
	adminUI: {
		auth: {
			primaryMethods: ['PASSWORD'],
			secondaryMethods: ['API_KEY', 'ONE_TIME_PASSWORD', 'MAGIC_LINK', 'WEB3', 'PASSKEY'],
		},
	},

	// Two clients hit the same endpoint, and each gets its own set of operations. `graphweaver
	// build` hashes each list into the server bundle; at runtime a client sends only the hash, and
	// the server decides which list that particular request is allowed to draw from.
	//
	// Graphweaver adds an `admin-ui` list of its own, holding the documents the Admin UI sends.
	trustedDocuments: {
		allowLists: {
			web: ['src/frontend/web/**/*.graphql'],
			mobile: ['src/frontend/mobile/**/*.graphql'],
		},
	},
};
