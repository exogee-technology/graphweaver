import { ApolloQueryResult } from '@apollo/client';
import React from 'react';
import { Await, useAsyncError, useLoaderData } from 'react-router-dom';
import styles from './styles.module.css';

const DetailPanelError = () => {
	const error = useAsyncError() as Error;

	console.error(error);

	return <pre className={styles.wrapper}>Error!: {error.message}</pre>;
};

export const DetailPanel = () => {
	const { detail } = useLoaderData() as { detail: any };

	if (!detail) return null;

	return (
		<React.Suspense fallback={<pre className={styles.wrapper}>Loading...</pre>}>
			<Await resolve={detail} errorElement={<DetailPanelError />}>
				{(detail: ApolloQueryResult<{ result: { id: string } }>) => (
					<pre className={styles.wrapper}>{JSON.stringify(detail.data.result, null, 4)}</pre>
				)}
			</Await>
		</React.Suspense>
	);
};
