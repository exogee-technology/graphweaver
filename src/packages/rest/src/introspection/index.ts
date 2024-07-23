import OpenAPIParser from '@readme/openapi-parser';
import { OpenAPIV2, OpenAPIV3 } from 'openapi-types';

export interface RestIntrospectionParams {
	openAPIFilePath: string;
	host: string;
}

export const nextQuestion = async (params: Partial<RestIntrospectionParams>) => {
	if (!params.openAPIFilePath) {
		return {
			type: 'input',
			name: 'openAPIFilePath',
			default: './openapi.yaml',
			message: `Where is the Open API specification file I should use?`,
		};
	}

	let result;
	try {
		result = await OpenAPIParser.dereference(params.openAPIFilePath);
	} catch (error) {
		console.error(`Error reading file: ${params.openAPIFilePath}`);
		console.error(error);

		return {
			type: 'input',
			name: 'openAPIFilePath',
			default: './openapi.yaml',
			message: `Where is the Open API specification file I should use?`,
		};
	}

	let { host } = params;
	if (!host) {
		// Do we have a v2 host?
		host = (result as OpenAPIV2.Document).host;
	}

	if (!host && (result as OpenAPIV3.Document).servers?.length) {
		// Ok, which one should we use?
		return {
			type: 'list',
			name: 'host',
			message: 'Which server URL should I use?',
			choices: (result as OpenAPIV3.Document).servers?.map((server) => server.url),
		};
	}

	if (!host) {
		// Ok, let's just ask.
		return {
			type: 'input',
			name: 'host',
			message: 'What is the server URL for the API?',
		};
	}
};

export const introspection = async ({ openAPIFilePath }: RestIntrospectionParams) => {
	const result = await OpenAPIParser.dereference(openAPIFilePath);
	console.log(`Introspecting REST API '${result.info.title}' version ${result.info.version}...`);

	for (const [path, operation] of Object.entries(result.paths ?? {})) {
		if (operation.get) {
			console.log(`GET ${path}`);
		}
	}
};
