import { useQuery } from '@apollo/client';
import {
	Header,
	Loader,
	Span,
	TraceViewer,
	TraceTable,
	decodeSearchParams,
	PAGE_SIZE,
	getOrderByQuery,
} from '@exogee/graphweaver-admin-ui-components';
import { useParams, useSearchParams } from 'react-router-dom';

import { queryForTrace, queryForTraces } from './graphql';

import styles from './styles.module.css';
import { ListToolBar } from '../list';

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
	const [search] = useSearchParams();
	const { sort, page, filters } = decodeSearchParams(search);

	const variables = {
		pagination: {
			offset: Math.max(page - 1, 0) * PAGE_SIZE,
			limit: PAGE_SIZE,
			orderBy: getOrderByQuery({ sort, defaultSort: { timestamp: 'DESC' } }),
		},
		...(filters
			? {
					filter: {
						...filters,
						parentId: null,
					},
				}
			: { filter: { parentId: null } }),
	};

	const { data, loading, error } = useQuery<{ traces: Span[] }>(queryForTraces, { variables });

	if (loading) {
		return <Loader />;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	return (
		<div className={styles.wrapper}>
			<Header>
				<ListToolBar />
			</Header>
			<TraceTable traces={data?.traces} />
		</div>
	);
};
