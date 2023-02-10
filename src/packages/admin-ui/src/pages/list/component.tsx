import { useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApolloError } from '@apollo/client';
import { SortColumn } from 'react-data-grid';

import {
	DetailPanel,
	Table,
	useSchema,
	PAGE_SIZE,
	routeFor,
	decodeSearchParams,
	SortField,
	Filter,
	DataContext,
	DataState,
	defaultEntityState,
} from '@exogee/graphweaver-admin-ui-components';
import '@exogee/graphweaver-admin-ui-components/lib/index.css';
import { fetchList } from './graphql';

export const List = () => {
	const { entity } = useParams();
	const [search, setSearch] = useSearchParams();
	const navigate = useNavigate();

	if (!entity) throw new Error('There should always be an entity at this point.');

	const { entityByName } = useSchema();

	// const [entityState, setEntityState] = useState<DataStateByEntity>({});

	const { entityState, setEntityState } = useContext(DataContext);

	const resetDataState = (entity: string, state: Partial<DataState>) => {
		setEntityState({
			...entityState,
			[entity]: { ...defaultEntityState, ...state },
		});
	};
	const setDataState = (entity: string, state: Partial<DataState>) => {
		const currentState = entityState[entity] ?? defaultEntityState;
		// PAGINATION: All but data are overwritten, data is appended
		// SORT/FILTER: Data is overwritten, starting from the beginning
		// As we don't know here which change has triggered the setter func,
		// Ensure that currentState.data is empty beforehand so we aren't just appending even when
		// we don't need to (ie. sort -> reset pagination and data before fetch -> fetch -> setDataState)
		// See resetDataState
		const newData = [...currentState.data, ...(state.data ?? [])];
		const newDataState = {
			...currentState,
			...state,
			data: newData,
		};
		setEntityState({ ...entityState, [entity]: newDataState });
	};

	const fetchData = useCallback(async () => {
		const currentState = entityState[entity] ?? defaultEntityState;

		if (currentState.allDataFetched) {
			return;
		}

		let data = [];
		let lastRecordReturned = false;
		const filter = currentState.filterField;
		const result = await fetchList<{ result: any[] }>(
			entity,
			entityByName,
			filter?.filter !== undefined ? filter : undefined,
			currentState.sortFields,
			currentState.page
		);
		data = result.data.result.slice();

		if (data.length < PAGE_SIZE) {
			lastRecordReturned = true;
		}

		const { loading, error } = result;
		setDataState(entity, { data, allDataFetched: lastRecordReturned, loading, error });
	}, [
		entity,
		entityState[entity]?.filterField,
		entityState[entity]?.sortFields,
		entityState[entity]?.page,
	]);

	useEffect(() => {
		const { filter, sort } = decodeSearchParams(search);
		// TODO: This will always cause a refetch even if search unchanged as data is cleared
		resetDataState(entity, { filterField: filter, sortFields: sort });
	}, [search]);

	useEffect(() => {
		fetchData()
			// TODO: error handling
			.catch(console.error);
	}, [
		fetchData,
		entity,
		entityState[entity]?.filterField,
		entityState[entity]?.sortFields,
		entityState[entity]?.page,
	]);

	const requestRefetch = (state: Partial<DataState>) => {
		state.sortFields ? requestSort(state) : incrementPage();
	};

	// TODO: Get warning in here that navigate should be in a useEffect
	const requestSort = (state: Partial<DataState>) => {
		const { filter } = decodeSearchParams(search);
		navigate(routeFor({ entity, sort: state.sortFields, filter }));
	};

	// Increment page only; leave the rest
	const incrementPage = () => {
		setDataState(entity, { page: (entityState[entity]?.page ?? defaultEntityState.page) + 1 });
	};

	const {
		loading,
		error,
		data,
		sortFields: sortColumns,
		allDataFetched,
	} = entityState[entity] ?? defaultEntityState;
	if (loading) {
		return <pre>Loading...</pre>;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	return (
		<>
			<Table
				rows={data}
				orderBy={sortColumns}
				requestRefetch={requestRefetch}
				allDataFetched={allDataFetched}
			/>
			<DetailPanel />
		</>
	);
};
