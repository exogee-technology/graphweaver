import GraphiQL from 'graphiql';
import 'graphiql/graphiql.min.css';

import { uri } from '../config';

export const Playground = () => {
	const auth = localStorage.getItem('graphweaver-auth');
	return (
		<GraphiQL
			fetcher={async (graphQLParams) => {
				const data = await fetch(uri, {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						...(auth ? { Authorization: auth } : {}),
					},
					body: JSON.stringify(graphQLParams),
					credentials: 'same-origin',
				});
				return data.json().catch(() => data.text());
			}}
		/>
	);
};
