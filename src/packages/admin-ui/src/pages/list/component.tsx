import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
	DetailPanel,
	Table,
	useSchema,
	PAGE_SIZE,
	decodeSearchParams,
	DataState,
	ToolBar,
	FieldFilter,
	Filter,
	TableRowItem,
	routeFor,
} from '@exogee/graphweaver-admin-ui-components';
import '@exogee/graphweaver-admin-ui-components/lib/index.css';
import { queryForEntityPage } from './graphql';

const andFilters = (filters: FieldFilter) => {
	const filter = Object.entries(filters)
		.map(([_, _filter]) => _filter)
		.filter((_filter): _filter is Filter => _filter !== undefined);

	if (filter.length === 0) return undefined;

	return filter.reduce<{ _and: unknown[] }>(
		(prev, curr) => {
			return {
				_and: [...prev._and, curr],
			};
		},
		{ _and: [] }
	);
};

export const ListToolBar = () => {
	const { entity } = useParams();
	const { entityByName } = useSchema();
	return (
		<ToolBar
			title={entity}
			subtitle={
				entity && entityByName(entity) ? `From ${entityByName(entity).backendId}` : undefined
			}
		/>
	);
};

export const List = () => {
	const { entity } = useParams();
	if (!entity) throw new Error('There should always be an entity at this point.');

	const navigate = useNavigate();
	const [search] = useSearchParams();
	const { entityByName } = useSchema();

	const { sort, page, filters } = decodeSearchParams(search);
	const orderBy = {
		...(sort
			? sort.reduce((acc, { field, direction }) => ({ ...acc, [field]: direction }), {})
			: { id: 'ASC' }),
	};

	const queryVariables = {
		pagination: {
			offset: Math.max(page - 1, 0) * PAGE_SIZE,
			limit: PAGE_SIZE,
			orderBy,
		},
		...(filters ? { filter: andFilters(filters) } : {}),
	};

	const { data, loading, error, fetchMore } = useQuery<{ result: TableRowItem[] }>(
		queryForEntityPage(entity, entityByName),
		{
			variables: queryVariables,
			notifyOnNetworkStatusChange: true,
		}
	);

	const initialLoading = !!(!data?.result && loading);
	const loadingNext = !!(data?.result && loading);

	useEffect(() => {
		fetchMore({
			variables: queryVariables,
		});
	}, [page, JSON.stringify(filters), JSON.stringify(sort)]);

	const requestRefetch = (state: Partial<DataState>) => {
		state.sortFields ? requestSort(state) : incrementPage();
	};

	const requestSort = (state: Partial<DataState>) => {
		navigate(routeFor({ entity, sort: state.sortFields, filters }));
	};

	const incrementPage = async () => {
		const isNextPage = !((data?.result.length ?? 0) % PAGE_SIZE);
		if (isNextPage) {
			const nextPage = (data?.result.length ?? 0) / PAGE_SIZE + 1;
			navigate(routeFor({ entity, sort, filters, page: nextPage }));
		}
	};

	return (
		<>
			<Table
				rows={data?.result || []}
				orderBy={sort ?? []}
				requestRefetch={requestRefetch}
				loading={initialLoading}
				loadingNext={loadingNext}
				error={error}
			/>
			<DetailPanel />
		</>
	);
};
