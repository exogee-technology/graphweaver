export const generateConfig = async (method: 'password' | 'magic-link') => {
	return `
// Generated Graphweaver Config
// This file contains the Graphweaver configuration used by the auth system.
module.exports = {
	adminUI: {
		auth: {
			primaryMethods: [${method === 'password' ? 'PASSWORD' : 'MAGIC_LINK'}],
		},
	},
};
`;
};
