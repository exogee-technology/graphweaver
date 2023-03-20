import GraphiQL from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

import 'graphiql/graphiql.min.css';

import { uri } from '../config';

// This Fetch Middleware does a few things:
//   1. If there's something called `graphweaver-auth` in local storage, we need to send that to the server.
//   2. If the server sends back a header called `X-Auth-Redirect` on any response, we need to redirect the user to that URL.
//   3. If the server sends back a header called `Authorization` on any response, we need to update our `graphweaver-auth` local storage value with
//      what we got from the server.
const fetchMiddleware = async (url: RequestInfo | URL, init?: RequestInit) => {
	const auth = localStorage.getItem('graphweaver-auth');
	const response = await fetch(url, {
		...init,
		headers: {
			...init?.headers,
			...(auth ? { Authorization: auth } : {}), // Feature 1 above ☝️
		},
	});

	// Feature 2 above ☝️
	// Do we have an auth redirect we need to do for OAuth?
	const redirectHeader = response.headers.get('X-Auth-Redirect');
	if (redirectHeader) window.location.href = redirectHeader;

	// Feature 3 above ☝️
	// Do we have an auth header we need to store?
	const authHeader = response.headers.get('Authorization');
	if (authHeader) localStorage.setItem('graphweaver-auth', authHeader);

	return response;
};

const fetcher = createGraphiQLFetcher({
	url: uri,
	fetch: fetchMiddleware,
});

export const Playground = () => {
	return <GraphiQL fetcher={fetcher} />;
};
