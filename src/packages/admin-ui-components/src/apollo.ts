import { ApolloClient, InMemoryCache, ApolloLink, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
	uri: import.meta.env.VITE_GRAPHWEAVER_API_URL || 'http://localhost:3000/graphql/v1',
	credentials: 'include',
});

// This link does several things:
//   1. If there's something called `graphweaver-auth` in local storage, we need to send that to the server.
//   2. If the server sends back a header called `X-Auth-Redirect` on any response, we need to redirect the user to that URL.
//   3. If the server sends back a header called `Authorization` on any response, we need to update our `graphweaver-auth` local storage value with
//      what we got from the server.
const authLink = new ApolloLink((operation, forward) => {
	// Feature 1 above ☝️
	if (localStorage.getItem('graphweaver-auth')) {
		operation.setContext({
			headers: {
				Authorization: localStorage.getItem('graphweaver-auth'),
			},
		});
	}

	return forward(operation).map((response) => {
		const context = operation.getContext();

		// Feature 2 above ☝️
		// Do we have an auth redirect we need to do for OAuth?
		const redirectHeader = context.response.headers.get('X-Auth-Redirect');
		if (redirectHeader) window.location.href = redirectHeader;

		// Feature 3 above ☝️
		// Do we have an auth header we need to store?
		const authHeader = context.response.headers.get('Authorization');
		if (authHeader) localStorage.setItem('graphweaver-auth', authHeader);

		return response;
	});
});

export const apolloClient = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache(),
});
