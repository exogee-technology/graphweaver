import { useParams } from 'react-router-dom';
import { Table } from '~/components';

import { fetchList } from './loader';
import { useCallback, useEffect, useState } from 'react';
import { ApolloError } from '@apollo/client';
import { DetailPanel } from '~/components';
import { SortColumn } from 'react-data-grid';
import { PAGE_SIZE } from '~/utils/data-loading';

type DataType = { id: string };
interface DataState {
	data: DataType[];
	sortColumns: SortColumn[];
	page: number;
	loading: boolean;
	error?: ApolloError;
	eof: boolean;
}

type DataStateByEntity = Record<string, DataState>;

const defaultEntityState = {
	data: [],
	sortColumns: [],
	page: 1,
	loading: false,
	error: undefined,
	eof: false,
};

export const List = () => {
	const { entity } = useParams();

	if (!entity) {
		throw new Error('There should always be an entity at this point.');
	}

	const [entityState, setEntityState] = useState<DataStateByEntity>({});

	const setDataState = (entity: string, state: Partial<DataState>) => {
		const currentState = entityState[entity] ?? defaultEntityState;
		// All but data are overwritten, data is appended
		const newData = [...currentState.data, ...(state.data ?? [])];
		const newDataState = {
			...currentState,
			...state,
			data: newData,
		};
		setEntityState((entityState) => ({ ...entityState, [entity]: newDataState }));
	};

	const fetchData = useCallback(async () => {
		const currentState = entityState[entity] ?? defaultEntityState;

		let data = [];
		let eof = false;

		if (currentState && !currentState.eof) {
			const result = await fetchList(entity, currentState.sortColumns, currentState.page);
			data = result.data.result;

			if (data.length < PAGE_SIZE) {
				eof = true;
			}
			const loading = result.loading;
			const error = result.error;
			setDataState(entity, { data, eof, loading, error });
		}
	}, [entity, entityState[entity]?.data]);

	// Don't add 'fetchData' to the dependency array, or this will inf loop
	// Only fire if either entity or page changes
	useEffect(() => {
		fetchData()
			// TODO: error handling
			.catch(console.error);
	}, [entity, entityState[entity]?.page]);

	const incrementPage = () => {
		setDataState(entity, { page: (entityState[entity]?.page ?? defaultEntityState.page) + 1 });
	};

	// const triggerRefetch = useCallback(() => {
	// 	incrementPage(entity);
	// }, [entity, entityState[entity]?.page]);

	const { loading, error, data, eof } = entityState[entity] ?? defaultEntityState;
	if (loading) {
		return <pre>Loading...</pre>;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	return (
		<>
			<Table rows={data} refetch={incrementPage} eof={eof} />
			<DetailPanel />
		</>
	);
};
