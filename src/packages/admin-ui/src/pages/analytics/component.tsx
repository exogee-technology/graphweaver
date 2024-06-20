import { useQuery } from '@apollo/client';
import { Header, Loader, TraceViewer } from '@exogee/graphweaver-admin-ui-components';
import { useParams } from 'react-router-dom';

import { queryForTrace, queryForTraces } from './graphql';

import styles from './styles.module.css';

export const TraceDetail = () => {
	const { id } = useParams();

	const { data, loading, error } = useQuery(queryForTrace, {
		variables: { id },
	});

	console.log(data);

	if (loading) {
		return <Loader />;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	return (
		<div className={styles.wrapper}>
			<Header>
				<div className="titleWrapper">
					<h1>Trace</h1>
					<p className="subtext">{`Detailed trace view for ${id}`}</p>
				</div>
			</Header>
			<TraceViewer trace={data} />
		</div>
	);
};

export const TraceList = () => {
	const { data, loading, error } = useQuery(queryForTraces);

	console.log(data);

	if (loading) {
		return <Loader />;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	return <div className={styles.wrapper}></div>;
};
