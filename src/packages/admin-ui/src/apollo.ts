import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
	uri: 'http://localhost:3000/graphql/v1',
	cache: new InMemoryCache(),
});
