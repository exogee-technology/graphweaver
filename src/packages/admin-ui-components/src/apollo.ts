import { ApolloClient, InMemoryCache } from '@apollo/client';

export const apolloClient = new ApolloClient({
	uri: (import.meta as any).env.VITE_GRAPHWEAVER_API_URL || 'http://localhost:3000/graphql/v1',
	cache: new InMemoryCache(),
});
