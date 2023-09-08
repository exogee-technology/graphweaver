import type {
	GatsbyNode,
	IPluginRefOptions,
	NodeInput,
	PluginOptions as GatsbyDefaultPluginOptions,
	SourceNodesArgs,
} from 'gatsby';

import { fetchGraphQL } from './utils';

export const CACHE_KEYS = {
	Timestamp: `timestamp`,
} as const;

export const ERROR_CODES = {
	GraphQLSourcing: `10000`,
} as const;

interface IPluginOptionsKeys {
	url: string;
	apiKey: string;
}

/**
 * Gatsby expects the plugin options to be of type "PluginOptions" for gatsby-node APIs (e.g. sourceNodes)
 */
export interface IPluginOptionsInternal extends IPluginOptionsKeys, GatsbyDefaultPluginOptions {}

/**
 * These are the public TypeScript types for consumption in gatsby-config
 */
export interface IPluginOptions extends IPluginOptionsKeys, IPluginRefOptions {}

//@todo - make this data a type generic and passed in from the client
type NodeBuilderInput = { type: string; data: any };

let isFirstSource = true;

/**
 * The sourceNodes API is the heart of a Gatsby source plugin. This is where data is ingested and transformed into Gatsby's data layer.
 * @see https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#sourceNodes
 */
export const sourceNodes: GatsbyNode[`sourceNodes`] = async (
	gatsbyApi,
	pluginOptions: IPluginOptionsInternal
) => {
	console.info('Processing source nodes...');

	const { actions, reporter, cache, getNodes } = gatsbyApi;
	const { touchNode } = actions;
	const { url, apiKey } = pluginOptions;

	/**
	 * It's good practice to give your users some feedback on progress and status. Instead of printing individual lines, use the activityTimer API.
	 * This will give your users a nice progress bar and can you give updates with the .setStatus API.
	 * In the end your users will also have the exact time it took to source the data.
	 * @see https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/#reporter
	 */
	const sourcingTimer = reporter.activityTimer(`Sourcing from GraphQL API`);
	sourcingTimer.start();

	if (isFirstSource) {
		/**
		 * getNodes() returns all nodes in Gatsby's data layer
		 */
		getNodes().forEach((node) => {
			/**
			 * "owner" is the name of your plugin, the "name" you defined in the package.json
			 */
			if (node.internal.owner !== `plugin`) {
				return;
			}

			/**
			 * Gatsby aggressively garbage collects nodes between runs. This means that nodes that were created in the previous run but are not created in the current run will be deleted. You can tell Gatsby to keep old, but still valid nodes around, by "touching" them.
			 * For this you need to use the touchNode API.
			 *
			 * However, Gatsby only checks if a node has been touched on the first sourcing. This is what the "isFirstSource" variable is for.
			 * @see https://www.gatsbyjs.com/docs/reference/config-files/actions/#touchNode
			 */
			touchNode(node);
		});

		isFirstSource = false;
	}

	/**
	 * If your API supports delta updates via e.g. a timestamp or token, you can store that information via the cache API.
	 *
	 * The cache API is a key-value store that persists between runs.
	 * You should also use it to persist results of time/memory/cpu intensive tasks.
	 * @see https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/#cache
	 */
	const lastFetchedDate: number = await cache.get(CACHE_KEYS.Timestamp);
	const lastFetchedDateCurrent = Date.now();

	/**
	 * The reporter API has a couple of methods:
	 * - info: Print a message to the console
	 * - warn: Print a warning message to the console
	 * - error: Print an error message to the console
	 * - panic: Print an error message to the console and exit the process
	 * - panicOnBuild: Print an error message to the console and exit the process (only during "gatsby build")
	 * - verbose: Print a message to the console that is only visible when the "verbose" flag is enabled (e.g. gatsby build --verbose)
	 * @see https://www.gatsbyjs.com/docs/reference/config-files/node-api-helpers/#reporter
	 *
	 * Try to keep the terminal information concise and informative. You can use the "verbose" method to print more detailed information.
	 * You don't need to print out every bit of detail your plugin is doing as otherwise it'll flood the user's terminal.
	 */
	reporter.verbose(`[plugin] Last fetched date: ${lastFetchedDate}`);

	interface IApiResponse {
		data: {
			events: Array<any>;
		};
		errors?: Array<{
			message: string;
			locations: Array<unknown>;
		}>;
	}

	/**
	 * Fetch data from the example API. This will differ from your implementation and personal preferences on e.g. which library to use.
	 * A good general recommendation is: https://github.com/sindresorhus/got
	 */
	const { data, errors } = await fetchGraphQL<IApiResponse>(
		url,
		apiKey,
		//  @todo - make this a generic query passed in from the client
		`#graphql
      query EventsCollection {
		events {
			id
			status
			title
			url
			summary
			eventStart
			eventEnd
			imageUrl
			contactName
			contactUrl
			place
			address
			latitude
			longitude
			created
			changed
			published
			isFree
			modules {
				id
				type
				data
			}
			widgets {
				id
				type
				data
			}
		}
      }
    `
	);

	if (errors) {
		sourcingTimer.panicOnBuild({
			id: ERROR_CODES.GraphQLSourcing,
			context: {
				sourceMessage: `Sourcing from GraphQL API failed`,
				graphqlError: errors[0].message,
			},
		});

		return;
	}

	/**
	 * Gatsby's cache API uses LMDB to store data inside the .cache/caches folder.
	 *
	 * As mentioned above, cache the timestamp of last sourcing.
	 * The cache API accepts "simple" data structures like strings, integers, arrays.
	 * For example, passing a Set or Map won't work because the "structuredClone" option is purposefully not enabled:
	 * https://github.com/kriszyp/lmdb-js#serialization-options
	 */
	await cache.set(CACHE_KEYS.Timestamp, lastFetchedDateCurrent);

	const events = data?.events ?? [];

	sourcingTimer.setStatus(`Processing ${events.length} events`);

	/**
	 * Iterate over the data and create nodes
	 */
	for (const event of events) {
		nodeBuilder({ gatsbyApi, input: { type: 'event', data: event } });
	}

	sourcingTimer.end();
};

interface INodeBuilderArgs {
	gatsbyApi: SourceNodesArgs;
	// This uses the "Discriminated Unions" pattern
	// https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-func.html#discriminated-unions
	input: NodeBuilderInput;
}

export function nodeBuilder({ gatsbyApi, input }: INodeBuilderArgs) {
	const id = gatsbyApi.createNodeId(`${input.type}-${input.data.id}`);

	const extraData: Record<string, unknown> = {};

	const node = {
		...input.data,
		...extraData,
		id,
		/**
		 * "id" is a reserved field in Gatsby, so if you want to keep it, you need to rename it
		 * You can see all reserved fields here:
		 * @see https://www.gatsbyjs.com/docs/reference/graphql-data-layer/node-interface/
		 */
		_id: input.data.id,
		parent: null,
		children: [],
		internal: {
			type: input.type,
			/**
			 * The content digest is a hash of the entire node.
			 * Gatsby uses this internally to determine if the node needs to be updated.
			 */
			contentDigest: gatsbyApi.createContentDigest(input.data),
		},
	} satisfies NodeInput;

	/**
	 * Add the node to Gatsby's data layer. This is the most important piece of a Gatsby source plugin.
	 * @see https://www.gatsbyjs.com/docs/reference/config-files/actions/#createNode
	 */
	gatsbyApi.actions.createNode(node);
}
