import { ApolloClient, InMemoryCache, ApolloLink, HttpLink } from '@apollo/client';
import { inflate } from 'graphql-deduplicator';
import { localStorageAuthKey, uri } from './config';

export const REDIRECT_HEADER = 'X-Auth-Request-Redirect';

// Allow custom pages / other components to use the `gql` tag as they need.
export { gql } from '@apollo/client';

const httpLink = new HttpLink({ uri });
const authLink = new ApolloLink((operation, forward) => {
	//  If there's something called `graphweaver-auth` in local storage, we need to send that to the server.
	const currentAuthToken = localStorage.getItem(localStorageAuthKey);

	// The token should include the type and the credential, if not let's emit a warning.
	if (currentAuthToken && currentAuthToken.split(' ').length < 2) {
		console.warn(
			'Current Graphweaver Auth Token is invalid, it should be in the form "[type] [credential]"'
		);
	}
	const currentRedirectSearchParam = new URLSearchParams(window.location.search).get(
		'redirect_uri'
	);
	const context = operation.getContext();
	const redirectUri =
		context?.headers?.[REDIRECT_HEADER] ?? currentRedirectSearchParam ?? window.location.origin;

	operation.setContext({
		headers: {
			...(context?.headers ? context.headers : {}),
			'Apollo-Require-Preflight': 'true',
			'Content-Type': 'application/json',
			...(currentAuthToken ? { Authorization: currentAuthToken } : {}),
			[REDIRECT_HEADER]: redirectUri,
		},
	});

	return forward(operation).map((response) => {
		const context = operation.getContext();
		// If the server sends back a header called `X-Auth-Redirect` on any response, we need to redirect the user to that URL
		// unless we're already there.
		const redirectHeader = context.response.headers.get('X-Auth-Redirect');
		if (redirectHeader && redirectHeader !== window.location.href) {
			window.location.href = redirectHeader;
		} else if (redirectHeader && redirectHeader === window.location.href) {
			console.warn(
				"Received redirect header from server but we're already at the redirect URL, no need to redirect."
			);
		}

		// If the server sends back a header called `Authorization` on any response, we need to
		// update our `graphweaver-auth` local storage value with what we got from the server.
		const newAuthToken = context.response.headers.get('Authorization');

		if (newAuthToken) {
			// The token should include the type and the credential, if not let's emit a warning.
			if (newAuthToken.split(' ').length < 2)
				console.warn(
					'New Graphweaver Auth Token is invalid, it should be in the form "[type] [credential]"'
				);
			localStorage.setItem(localStorageAuthKey, newAuthToken);
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
