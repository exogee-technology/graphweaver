import { useQuery } from '@apollo/client';
import {
	Header,
	Loader,
	Span,
	TraceViewer,
	TraceTable,
} from '@exogee/graphweaver-admin-ui-components';
import { useParams } from 'react-router-dom';

import { queryForTrace, queryForTraces } from './graphql';

import styles from './styles.module.css';

export const TraceDetail = () => {
	const { id } = useParams();

	const { data, loading, error } = useQuery<{ traces: Span[] }>(queryForTrace, {
		variables: { id },
	});

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
			<TraceViewer traces={data?.traces} />
		</div>
	);
};

export const TraceList = () => {
	const { data, loading, error } = useQuery<{ traces: Span[] }>(queryForTraces);

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
					<h1>Traces</h1>
				</div>
			</Header>
			<TraceTable traces={data?.traces} />
		</div>
	);
};
