import OpenAPIParser from '@readme/openapi-parser';
import { OpenAPI, OpenAPIV2, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import { input, select } from '@inquirer/prompts';
import { SchemaEntityFile, SchemaIndexFile } from './files';

export interface RestIntrospectionParams {
	openAPIFilePathOrUrl: string;
	host?: string;
}

export interface EntityInformation {
	name: string;
	fields: FieldInformation[];
	operations?: {
		[operationType in 'list' | 'getOne' | 'create' | 'update' | 'delete']?: {
			path: string;
			httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
		};
	};
}

export interface FieldInformation {
	name: string;
	type: string;
	primary?: boolean;
	description?: string;
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
			openAPIFile = await OpenAPIParser.parse(openAPIFilePathOrUrl);
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

const getOperationTypeForPathItem = (
	path: string,
	pathItem: OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject
): {
	operationType: 'delete' | 'update' | 'create' | 'getOne' | 'list';
	httpMethod: 'DELETE' | 'PUT' | 'POST' | 'GET';
	operation: OpenAPIV2.OperationObject | OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
} => {
	if (pathItem.delete)
		return { operationType: 'delete', httpMethod: 'DELETE', operation: pathItem.delete };
	if (pathItem.put) return { operationType: 'update', httpMethod: 'PUT', operation: pathItem.put };
	if (pathItem.post)
		return { operationType: 'create', httpMethod: 'POST', operation: pathItem.post };
	if (pathItem.get) {
		const segments = path.split('/');
		if (segments[segments.length - 1].startsWith('{'))
			return { operationType: 'getOne', httpMethod: 'GET', operation: pathItem.get };
		return { operationType: 'list', httpMethod: 'GET', operation: pathItem.get };
	}

	console.log(`Unknown operation type for path ${path}`);
	console.log('Path item: ', pathItem);

	throw new Error(`Unknown operation type for path ${path}`);
};

const normaliseReference = (reference: string | undefined) => {
	if (!reference) return undefined;
	const chunks = reference.split('/');
	return chunks[chunks.length - 1];
};

export const introspection = async ({ openAPIFilePathOrUrl }: RestIntrospectionParams) => {
	const { host, openAPIFile } = await getAndParseSchemaFile({ openAPIFilePathOrUrl });

	const v3File = openAPIFile as OpenAPIV3_1.Document;
	const v2File = openAPIFile as OpenAPIV2.Document;

	if (!v3File.components?.schemas && !v2File.definitions) {
		throw new Error('No components or definitions found in the OpenAPI file');
	}

	// Determine all the entities from the definitions.
	const entities = v3File.components?.schemas
		? extractEntitiesFromSchemas(v3File.components.schemas)
		: extractEntitiesFromDefinitions(v2File.definitions!);

	// For each path, can we link it back to an entity?
	const nonEntityPaths: Array<
		OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject
	> = [];

	for (const path in openAPIFile.paths) {
		const pathItem = openAPIFile.paths[path];
		if (!pathItem) continue;

		const { operation, operationType, httpMethod } = getOperationTypeForPathItem(path, pathItem);
		const successResponse = operation.responses?.[200];

		// Are we in v2 or v3?
		const v2Success = successResponse as OpenAPIV2.ResponseObject;
		const v3Success = successResponse as OpenAPIV3.ResponseObject;

		if (v3Success.content?.['application/json']?.schema) {
			// We're in v3
			throw new Error('V3 is not supported yet');
		} else if (v2Success.schema) {
			// We're in v2
			if (
				(v2Success.schema as OpenAPIV2.SchemaObject).type === 'array' ||
				(v2Success.schema as OpenAPIV2.SchemaObject).type === 'object'
			) {
				const definitionName = normaliseReference(
					(v2Success.schema as OpenAPIV2.SchemaObject).$ref ??
						(v2Success.schema as OpenAPIV2.SchemaObject).items?.$ref
				);
				if (!definitionName) {
					console.log('Definition name not found in 200 response for endpoint. ', {
						definitionName,
						successResponse,
					});
					throw new Error('Definition name not found in 200 response for endpoint.');
				}

				const entity = entities[definitionName];
				if (entity) {
					entity.operations = {
						...entity.operations,
						[operationType]: { path, httpMethod },
					};
				} else {
					nonEntityPaths.push(pathItem);
				}
			} else {
				throw new Error('What is happening here?');
			}
		} else {
			console.log(
				'Could not understand response type in 200 response for endpoint.',
				successResponse
			);
			throw new Error('Could not understand response type in 200 response for endpoint.');
		}
	}

	// Filter out any entities that don't have operations.
	for (const entity in entities) {
		if (!entities[entity].operations) {
			console.log('Entity has no operations, ignoring: ', entity);
			delete entities[entity];
		}
	}

	console.log('Entities: ', entities);

	const results: Array<{
		path: string;
		name: string;
		contents: string;
		needOverwriteWarning: boolean;
	}> = [];

	// For each entity, we need to generate the files.
	const entityFiles = Object.values(entities);
	for (const entity of entityFiles) {
		const file = new SchemaEntityFile(host, entity);
		results.push({
			path: file.getBasePath(),
			name: file.getBaseName(),
			contents: file.generate(),
			needOverwriteWarning: false,
		});
	}

	// Export all the entities from the data source directory
	const file = new SchemaIndexFile(entityFiles);
	results.push({
		path: file.getBasePath(),
		name: file.getBaseName(),
		contents: file.generate(),
		needOverwriteWarning: true,
	});

	// For the remainders generate an additional path.

	// for (const [path, configuration] of Object.entries(openAPIFile.paths ?? {}) as [
	// 	string,
	// 	OpenAPIV2.PathItemObject | OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject,
	// ][]) {
	// 	// Extract entity name from path - will be used to group API endpoints
	// 	const entityName = entityNameFromPath(path);
	// 	const { operationType, httpMethod } = getOperationTypeForPathItem(path, configuration);

	// 	const existingEntity = entityMap[entityName] || {};
	// 	if (existingEntity[operationType]) {
	// 		throw new Error(`Duplicate operation type ${operationType} for entity ${entityName}`);
	// 	}

	// 	existingEntity[operationType] = { path, httpMethod };

	// 	entityMap[entityName] = existingEntity;
	// 	console.log('Path: ', path);
	// 	console.log('Configuration: ', configuration);
	// }

	// // Ok, we need to generate endpoints for all of the remaining operations that haven't been
	// // transformed into standard entities.
	// let extraOperations = {};
	// for (const [path, operation] of operations) {
	// 	if (operation.get) {
	// 	}
	// }

	return results;
};

const graphQLTypeForType = (type: string | string[] | undefined) => {
	if (type === undefined) return 'unknown';
	if (Array.isArray(type)) {
		if (type.length > 0) return graphQLTypeForType(type[0]);
		return 'unknown';
	}

	if (type === 'string') return 'string';
	if (type === 'number') return 'number';
	if (type === 'integer') return 'number';
	if (type === 'boolean') return 'bool';

	console.log('Unknown type in graphQLTypeForType: ', type);
	return type;
};

const extractEntitiesFromDefinitions = (definitions: OpenAPIV2.DefinitionsObject) => {
	const entities: { [openAPIName: string]: EntityInformation } = {};

	for (const [definitionName, typeDefinition] of Object.entries(definitions)) {
		if (typeDefinition.type !== 'object') continue;
		if (entities[definitionName]) throw new Error(`Duplicate definition name: ${definitionName}`);

		// Uppercase the first letter of name to get the entity name
		const name = definitionName.charAt(0).toUpperCase() + definitionName.slice(1);
		const entity: EntityInformation = {
			name,
			fields: [],
		};

		for (const [fieldName, fieldInfo] of Object.entries(typeDefinition.properties ?? {})) {
			entity.fields.push({
				name: fieldName,
				type: graphQLTypeForType(fieldInfo.type),
			});
		}

		entities[definitionName] = entity;
	}

	return entities;
};

const extractEntitiesFromSchemas = (
	schemas: OpenAPIV3.ComponentsObject['schemas'] | OpenAPIV3_1.ComponentsObject['schemas']
) => {
	console.log('Schemas: ', schemas);
	const entities: { [openAPIName: string]: EntityInformation } = {};

	return entities;
};
