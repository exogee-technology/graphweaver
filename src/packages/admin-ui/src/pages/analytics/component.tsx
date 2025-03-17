import { useQuery } from '@apollo/client';
import { Header, Loader, Span, TraceViewer } from '@exogee/graphweaver-admin-ui-components';
import { useParams } from 'wouter';

import { queryForTrace } from './graphql';

import styles from './styles.module.css';

export const TraceDetail = () => {
	const { id } = useParams();

	const { data, loading, error } = useQuery<{ traces: Span[] }>(queryForTrace, {
		variables: { id },
		context: { headers: { ['x-graphweaver-suppress-tracing']: 'true' } },
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
