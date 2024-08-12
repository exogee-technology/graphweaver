export const generateConfig = async () => {
	return `
// Generated Graphweaver Config
// This file contains the Graphweaver configuration used by the auth system.
module.exports = {
	adminUI: {
		auth: {
			primaryMethods: ['PASSWORD'],
		},
	},
};
`;
};
