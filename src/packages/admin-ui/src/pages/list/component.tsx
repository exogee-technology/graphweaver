import { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { useParams, useSearchParams } from 'react-router-dom';

import {
	DetailPanel,
	Table,
	useSchema,
	PAGE_SIZE,
	decodeSearchParams,
	DataState,
	ToolBar,
	encodeSearchParams,
	FieldFilter,
	Filter,
} from '@exogee/graphweaver-admin-ui-components';
import '@exogee/graphweaver-admin-ui-components/lib/index.css';
import { queryForEntityPage } from './graphql';

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

export const List = () => {
	const { entity } = useParams();
	const [search, setSearchParams] = useSearchParams();

	if (!entity) throw new Error('There should always be an entity at this point.');

	const { entityByName } = useSchema();

	// const { entityState, setEntityState } = useContext(DataContext);

	// const getDefaultEntityState = () => {
	// 	const { filters } = decodeSearchParams(search);
	// 	return {
	// 		...defaultEntityState,
	// 		filterFields: filters,
	// 	};
	// };

	// const resetDataState = (entity: string, state: Partial<DataState>) => {
	// 	setEntityState({
	// 		...entityState,
	// 		[entity]: { ...getDefaultEntityState(), ...state },
	// 	});
	// };
	// const setDataState = (entity: string, state: Partial<DataState>) => {
	// 	const currentState = entityState[entity] ?? getDefaultEntityState();
	// 	const newData = [...currentState.data, ...(state.data ?? [])];
	// 	const newDataState = {
	// 		...currentState,
	// 		...state,
	// 		data: newData,
	// 	};
	// 	setEntityState({ ...entityState, [entity]: newDataState });
	// };

	// const fetchData = useCallback(async () => {
	// 	const currentState = entityState[entity] ?? getDefaultEntityState();

	// 	if (currentState.allDataFetched) {
	// 		return;
	// 	}

	// 	let data = [];
	// 	let lastRecordReturned = false;
	// 	const result = await fetchList<{ result: any[] }>(
	// 		entity,
	// 		entityByName,
	// 		currentState.filterFields,
	// 		currentState.sortFields,
	// 		currentState.page
	// 	);
	// 	data = result.data.result.slice();

	// 	if (data.length < PAGE_SIZE) {
	// 		lastRecordReturned = true;
	// 	}

	// 	const { loading, error } = result;
	// 	setDataState(entity, {
	// 		data,
	// 		allDataFetched: lastRecordReturned,
	// 		loading,
	// 		loadingNext: false,
	// 		error,
	// 	});
	// }, [
	// 	entity,
	// 	entityState[entity]?.filterFields,
	// 	entityState[entity]?.sortFields,
	// 	entityState[entity]?.page,
	// ]);

	// useEffect(() => {
	// 	const { filters, sort } = decodeSearchParams(search);
	// 	resetDataState(entity, { ...(filters ? { filterFields: filters } : {}), sortFields: sort });
	// }, [search]);

	// useEffect(() => {
	// 	fetchData().catch(console.error);
	// }, [
	// 	fetchData,
	// 	entity,
	// 	entityState[entity]?.filterFields,
	// 	entityState[entity]?.sortFields,
	// 	entityState[entity]?.page,
	// ]);

	const requestRefetch = (state: Partial<DataState>) => {
		//state.sortFields ? requestSort(state) : incrementPage();
	};

	// const requestSort = (state: Partial<DataState>) => {
	// 	setSearchParams((_search) =>
	// 		encodeSearchParams({
	// 			..._search,
	// 			sort: state.sortFields,
	// 		})
	// 	);
	// };

	const { sort, page, filters } = decodeSearchParams(search);
	const filter = filters ? andFilters(filters) : undefined;
	const orderBy = {
		id: 'ASC',
	};

	const { data, loading, error, fetchMore, refetch } = useQuery<{ result: any[] }>(
		queryForEntityPage(entity, entityByName),
		{
			variables: {
				pagination: {
					offset: Math.max(page - 1, 0) * PAGE_SIZE,
					limit: PAGE_SIZE,
					orderBy,
				},
				...(filter ? { filter } : {}),
			},
			notifyOnNetworkStatusChange: true,
		}
	);

	const initialLoading = !!(!data?.result && loading);
	const loadingNext = !!(data?.result && loading);

	const incrementPage = async () => {
		const isNextPage = !((data?.result.length ?? 0) % PAGE_SIZE);
		if (isNextPage) {
			setSearchParams(
				encodeSearchParams({
					sort,
					filters,
					page: page + 1,
				})
			);
		}
	};

	useEffect(() => {
		fetchMore({
			variables: {
				pagination: {
					offset: page * PAGE_SIZE,
					limit: PAGE_SIZE,
					orderBy,
				},
				...(filter ? { filter } : {}),
			},
		});
	}, [page]);

	useEffect(() => {
		console.log(filter);
	}, [filter]);

	return (
		<>
			<Table
				rows={data?.result || []}
				orderBy={sort}
				requestRefetch={requestRefetch}
				loading={initialLoading}
				loadingNext={loadingNext}
				error={error}
			/>
			<DetailPanel />
		</>
	);
};
