import GraphiQL from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

import 'graphiql/graphiql.min.css';

import { uri } from '../config';

export const Playground = () => {
	// There is probably a better way to do this
	// We could have a global context with the auth information
	// Then we only need to read the auth details in a single location
	const auth = localStorage.getItem('graphweaver-auth');
	const fetcher = createGraphiQLFetcher({
		url: uri,
		headers: { ...(auth ? { Authorization: auth } : {}) },
	});
	<GraphiQL fetcher={fetcher} />;
};
