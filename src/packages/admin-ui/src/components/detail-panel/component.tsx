import { ApolloQueryResult } from '@apollo/client';
import React from 'react';
import { Await, useLoaderData } from 'react-router-dom';
import styles from './styles.module.css';

export const DetailPanel = () => {
	const { detail } = useLoaderData() as { detail: any };

	if (!detail) return null;

	return (
		<React.Suspense fallback={<p>Loading...</p>}>
			<Await resolve={detail} errorElement={<p>Error!</p>}>
				{(detail: ApolloQueryResult<{ result: { id: string } }>) => (
					<pre className={styles.wrapper}>{JSON.stringify(detail.data.result, null, 4)}</pre>
				)}
			</Await>
		</React.Suspense>
	);
};
