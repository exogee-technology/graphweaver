import fetch from 'cross-fetch';
import { getIntrospectionQuery, buildClientSchema } from 'graphql';

const backendEndpoint = 'http://localhost:9001';

let schema: any;

export default async () => {
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
