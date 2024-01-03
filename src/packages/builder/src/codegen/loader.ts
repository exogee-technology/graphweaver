import fetch from 'cross-fetch';
import { getIntrospectionQuery, buildClientSchema, GraphQLSchema } from 'graphql';

const backendEndpoint = 'http://localhost:9001';

let schema: any;

export default async (preGeneratedSchema?: GraphQLSchema) => {
	if (preGeneratedSchema) return preGeneratedSchema;
	if (schema) return schema;

	const introspectionQuery = getIntrospectionQuery();

	const response = await fetch(backendEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ query: introspectionQuery }),
	});

	const data = await response.json();

	schema = buildClientSchema(data.data);

	return schema;
};
