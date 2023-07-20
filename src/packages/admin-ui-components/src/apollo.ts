import { ApolloClient, InMemoryCache, ApolloLink, HttpLink } from '@apollo/client';
import { inflate } from 'graphql-deduplicator';

import { uri } from './config';

const AUTH_TOKEN_LOCAL_STORAGE_KEY = 'graphweaver-auth';

const httpLink = new HttpLink({
	uri,
});

const isExpired = (token: string) => {
	try {
		const decodedJwt = JSON.parse(atob(token.split('.')[1]));
		return decodedJwt.exp * 1000 < Date.now();
	} catch (e) {
		return true;
	}
};

const authLink = new ApolloLink((operation, forward) => {
	//  If there's something called `graphweaver-auth` in local storage, we need to send that to the server.
	let currentAuthToken = localStorage.getItem(AUTH_TOKEN_LOCAL_STORAGE_KEY);

	// The token should include the type and the credential, if not let's emit a warning.
	if (currentAuthToken && currentAuthToken.split(' ').length < 2)
		console.warn(
			'Current Graphweaver Auth Token is invalid, it should be in the form "[type] [credential]"'
		);

	if (currentAuthToken && isExpired(currentAuthToken)) {
		console.warn('Current Graphweaver Auth Token is expired, removing expired token.');
		localStorage.removeItem(AUTH_TOKEN_LOCAL_STORAGE_KEY);
		currentAuthToken = null;
	}

	operation.setContext({
		headers: {
			'Apollo-Require-Preflight': 'true',
			'Content-Type': 'application/json',
			...(currentAuthToken ? { Authorization: currentAuthToken } : {}),
		},
	});

	return forward(operation).map((response) => {
		const context = operation.getContext();

		//  If the server sends back a header called `X-Auth-Redirect` on any response, we need to redirect the user to that URL.
		const redirectHeader = context.response.headers.get('X-Auth-Redirect');
		if (redirectHeader) window.location.href = redirectHeader;

		// If the server sends back a header called `Authorization` on any response, we need to
		// update our `graphweaver-auth` local storage value with what we got from the server.
		const newAuthToken = context.response.headers.get('Authorization');

		if (newAuthToken) {
			// The token should include the type and the credential, if not let's emit a warning.
			if (newAuthToken.split(' ').length < 2)
				console.warn(
					'New Graphweaver Auth Token is invalid, it should be in the form "[type] [credential]"'
				);
			localStorage.setItem(AUTH_TOKEN_LOCAL_STORAGE_KEY, newAuthToken);
		}

		// Inflate the response data, this is deduplicated by default
		if (response.data) {
			response.data = inflate(response.data);
		}
		return response;
	});
});

export const apolloClient = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache(),
});
