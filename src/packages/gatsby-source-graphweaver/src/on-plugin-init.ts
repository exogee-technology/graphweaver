import type { GatsbyNode } from 'gatsby';

/**
 * Use the onPluginInit API to set up things that should be run before the plugin is initialized.
 * You can use this e.g. for the reporter.setErrorMap API. Using this API is optional, but highly recommended.
 * By providing your own errors you can make it clearer to your users where the error is coming from and you can control what to show.
 * Using the ERROR_CODES enum you can reference the IDs without knowing them by hard.
 * @see https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onPluginInit
 * @see https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/#reporter
 */
export const onPluginInit: GatsbyNode[`onPluginInit`] = async ({ reporter }) => {
	reporter.info('Starting gatsby-source-graphweaver plugin...');
	await new Promise((resolve) => setTimeout(resolve, 5000));
	reporter.setErrorMap({
		['10000']: {
			text: (context) => `${context.sourceMessage}: ${context.graphqlError}`,
			level: `ERROR`,
			category: `THIRD_PARTY`,
		},
	});
};
