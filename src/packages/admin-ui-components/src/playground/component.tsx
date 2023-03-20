import GraphiQL from 'graphiql';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

import 'graphiql/graphiql.min.css';

import { uri } from '../config';

const auth = localStorage.getItem('graphweaver-auth');
const fetcher = createGraphiQLFetcher({
	url: uri,
	headers: { ...(auth ? { Authorization: auth } : {}) },
});

export const Playground = () => <GraphiQL fetcher={fetcher} />;
