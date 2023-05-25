import { ApolloClient, InMemoryCache, ApolloLink, HttpLink } from '@apollo/client';
import { uri } from './config';

const httpLink = new HttpLink({
	uri,
});

const authLink = new ApolloLink((operation, forward) => {
	//  If there's something called `graphweaver-auth` in local storage, we need to send that to the server.
	const currentAuthToken = localStorage.getItem('graphweaver-auth');

	// The token should include the type and the credential, if not let's emit a warning.
	if (currentAuthToken && currentAuthToken.split(' ').length < 2)
		console.warn(
			'Current Graphweaver Auth Token is invalid, it should be in the form "[type] [credential]"'
		);

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
			localStorage.setItem('graphweaver-auth', newAuthToken);
		}

		return response;
	});
});

export const apolloClient = new ApolloClient({
	link: authLink.concat(httpLink),
	cache: new InMemoryCache(),
});
