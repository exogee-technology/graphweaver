import OpenAPIParser from '@readme/openapi-parser';
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { input, select } from '@inquirer/prompts';

export interface RestIntrospectionParams {
	openAPIFilePathOrUrl: string;
	host?: string;
}

export const getAndParseSchemaFile = async (params: Partial<RestIntrospectionParams>) => {
	let { openAPIFilePathOrUrl } = params;
	// Let's load the file and see if it's valid.
	let openAPIFile: OpenAPI.Document | undefined = undefined;

	while (!openAPIFile) {
		while (!openAPIFilePathOrUrl) {
			openAPIFilePathOrUrl = await input({
				default: './openapi.yaml',
				message: `Where is the Open API specification file I should use? Both file paths and URLs are supported.`,
			});
		}

		try {
			// We could use OpenAPIParser.validate(openAPIFilePathOrUrl) here, but we aren't actually the police here.
			// If it parses enough that we can make it intelligible, that's good enough for us.
			openAPIFile = await OpenAPIParser.dereference(openAPIFilePathOrUrl);
		} catch (error) {
			console.error(error);
			openAPIFilePathOrUrl = undefined;
		}
	}

	let { host } = params;
	if (!host) {
		// Do we have a v2 host?
		host = (openAPIFile as OpenAPIV2.Document).host;
	}

	if (!host && (openAPIFile as OpenAPIV3.Document).servers?.length) {
		// Ok, which one should we use?
		host = await select({
			message: 'Which server URL should I use?',
			choices: (openAPIFile as OpenAPIV3.Document).servers!.map((server) => ({
				value: server.url,
			})),
		});
	}

	if (!host) {
		// Ok, let's just ask.
		host = await input({ message: 'What is the server URL for the API?' });
	}

	return { openAPIFile, host };
};

export const introspection = async ({ openAPIFilePathOrUrl }: RestIntrospectionParams) => {
	const { host, openAPIFile } = await getAndParseSchemaFile({ openAPIFilePathOrUrl });

	const operations = [...Object.entries(openAPIFile.paths ?? {})];

	// Ok, we need to generate endpoints for all of the remaining operations that haven't been
	// transformed into standard entities.
	let extraOperations = {};
	for (const [path, operation] of operations) {
		if (operation.get) {
		}
	}

	const entities = (openAPIFile as OpenAPIV2.Document).definitions
		? extractEntitiesFromDefinitions((openAPIFile as OpenAPIV2.Document).definitions!)
		: [];
	for (const [path, operation] of Object.entries(openAPIFile.paths ?? {})) {
		if (operation.get) {
			console.log(`GET ${host}${path}`);
		}
	}
};

const extractEntitiesFromDefinitions = (definitions: OpenAPIV2.DefinitionsObject) => {
	console.log(definitions);
};
