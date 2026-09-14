// `.cts` is CommonJS despite being TypeScript, so it gets `module.exports` like a `.js` config
// does. Everything else is treated as a module.
const usesEsmSyntax = (configFileName: string) =>
	configFileName.endsWith('.ts') || configFileName.endsWith('.mts');

export const generateConfig = async (
	method: 'password' | 'magic-link',
	configFileName = 'graphweaver-config.js'
) => {
	const body = `{
	adminUI: {
		auth: {
			primaryMethods: ["${method === 'password' ? 'PASSWORD' : 'MAGIC_LINK'}"],
		},
	},
}`;

	return `
// Generated Graphweaver Config
// This file contains the Graphweaver configuration used by the auth system.
${usesEsmSyntax(configFileName) ? `export default ${body};` : `module.exports = ${body};`}
`;
};
