import { useQuery } from '@apollo/client';

import { queryForTrace } from './graphql';

import styles from './styles.module.css';

import { TraceViewer } from './trace/viewer';

export const Analytics = () => {
	const { data, loading, error } = useQuery(queryForTrace);

	if (loading) return <div className={styles.wrapper}>Loading...</div>;
	if (error) return <div className={styles.wrapper}>Error: {error.message}</div>;

	return (
		<div className={styles.wrapper}>
			<TraceViewer trace={data} />
		</div>
	);
};
