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
	DataContext,
	DataState,
	defaultEntityState,
	ToolBar,
} from '@exogee/graphweaver-admin-ui-components';
import '@exogee/graphweaver-admin-ui-components/lib/index.css';
import { fetchList } from './graphql';

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
	const [search] = useSearchParams();
	const navigate = useNavigate();

	if (!entity) throw new Error('There should always be an entity at this point.');

	const { entityByName } = useSchema();

	const { entityState, setEntityState } = useContext(DataContext);

	const getDefaultEntityState = () => {
		const { filters } = decodeSearchParams(search);
		return {
			...defaultEntityState,
			filterFields: filters,
		};
	};

	const resetDataState = (entity: string, state: Partial<DataState>) => {
		setEntityState({
			...entityState,
			[entity]: { ...getDefaultEntityState(), ...state },
		});
	};
	const setDataState = (entity: string, state: Partial<DataState>) => {
		const currentState = entityState[entity] ?? getDefaultEntityState();
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
		const currentState = entityState[entity] ?? getDefaultEntityState();

		if (currentState.allDataFetched) {
			return;
		}

		let data = [];
		let lastRecordReturned = false;
		const result = await fetchList<{ result: any[] }>(
			entity,
			entityByName,
			currentState.filterFields,
			currentState.sortFields,
			currentState.page
		);
		data = result.data.result.slice();

		if (data.length < PAGE_SIZE) {
			lastRecordReturned = true;
		}

		const { loading, error } = result;
		setDataState(entity, {
			data,
			allDataFetched: lastRecordReturned,
			loading,
			loadingNext: false,
			error,
		});
	}, [
		entity,
		entityState[entity]?.filterFields,
		entityState[entity]?.sortFields,
		entityState[entity]?.page,
	]);

	useEffect(() => {
		const { filters, sort } = decodeSearchParams(search);
		// TODO: This will always cause a refetch even if search unchanged as data is cleared
		resetDataState(entity, { ...(filters ? { filterFields: filters } : {}), sortFields: sort });
		// const sortColumns: SortColumn[] = Array.from(search.entries()).map((field) => ({
		// 	columnKey: field[0],
		// 	direction: field[1].toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
		// }));
		// // This will always cause a refetch even if search unchanged as data is cleared
		// resetDataState(entity, { sortColumns });
	}, [search]);

	useEffect(() => {
		fetchData()
			// TODO: error handling
			.catch(console.error);
	}, [
		fetchData,
		entity,
		entityState[entity]?.filterFields,
		entityState[entity]?.sortFields,
		entityState[entity]?.page,
	]);

	const requestRefetch = (state: Partial<DataState>) => {
		state.sortFields ? requestSort(state) : incrementPage();
	};

	// TODO: Get warning in here that navigate should be in a useEffect
	// Makes no sense, this is triggered by a user event
	const requestSort = (state: Partial<DataState>) => {
		const { filters } = decodeSearchParams(search);
		navigate(routeFor({ entity, sort: state.sortFields, filters }));
	};

	// Increment page only; leave the rest, set signal to table to show 'Loading' indicator.
	// Do not trigger navigation
	const incrementPage = () => {
		setDataState(entity, {
			loadingNext: true,
			page: (entityState[entity]?.page ?? getDefaultEntityState().page) + 1,
		});
	};

	const { loading, loadingNext, error, data, sortFields, allDataFetched } =
		entityState[entity] ?? getDefaultEntityState();

	return (
		<>
			<Table
				rows={data}
				orderBy={sortFields}
				requestRefetch={requestRefetch}
				allDataFetched={allDataFetched}
				loading={loading}
				loadingNext={loadingNext}
				error={error}
			/>
			<DetailPanel />
		</>
	);
};
