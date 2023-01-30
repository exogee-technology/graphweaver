import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApolloError } from '@apollo/client';
import { SortColumn } from 'react-data-grid';

import {
	DetailPanel,
	Table,
	useSchema,
	PAGE_SIZE,
	routeFor,
} from '@exogee/graphweaver-admin-ui-components';
import '@exogee/graphweaver-admin-ui-components/lib/index.css';
import { fetchList } from './graphql';

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
	const [search, setSearch] = useSearchParams();
	const navigate = useNavigate();
	const schema = useSchema();

	if (!entity) throw new Error('There should always be an entity at this point.');

	const { entityByName } = useSchema();
	const schemaEntity = entityByName(entity);

	const [entityState, setEntityState] = useState<DataStateByEntity>({});

	const resetDataState = (entity: string, state: Partial<DataState>) => {
		setEntityState((entityState) => ({
			...entityState,
			[entity]: { ...defaultEntityState, ...state },
		}));
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
		setEntityState((entityState) => ({ ...entityState, [entity]: newDataState }));
	};

	const fetchData = useCallback(async () => {
		const currentState = entityState[entity] ?? defaultEntityState;

		let data = [];
		let lastRecordReturned = false;

		if (!currentState.eof) {
			// fetchList will remove enum type sortColumns to avoid Apollo exceptions...
			// TODO: This is a far-from-ideal solution
			const result = await fetchList<{ result: any[] }>(
				entity,
				entityByName,
				currentState.sortColumns,
				currentState.page
			);
			data = result.data.result.slice();
			// ...So if one was used, do the search here now
			for (const col of currentState.sortColumns) {
				const field = schemaEntity.fields.find((f) => f.name === col.columnKey);
				const num = field ? schema.enumByName(field.type) : undefined;
				if (num && field) {
					const sign = col.direction === 'ASC' ? 1 : -1;
					data.sort((a: any, b: any) =>
						a[field.name] > b[field.name] ? sign : a[field.name] < b[field.name] ? -1 * sign : 0
					);
					// TODO: multi-column sort
					break;
				}
			}

			if (data.length < PAGE_SIZE) {
				lastRecordReturned = true;
			}
			const { loading, error } = result;
			setDataState(entity, { data, eof: lastRecordReturned, loading, error });
		}
	}, [entity, entityState[entity]?.sortColumns, entityState[entity]?.page]);

	useEffect(() => {
		const sortColumns: SortColumn[] = Array.from(search.entries()).map((field) => ({
			columnKey: field[0],
			direction: field[1].toUpperCase() === 'ASC' ? 'ASC' : 'DESC',
		}));
		// TODO: This will always cause a refetch even if search unchanged as data is cleared
		resetDataState(entity, { sortColumns });
	}, [search]);

	useEffect(() => {
		fetchData()
			// TODO: error handling
			.catch(console.error);
	}, [fetchData, entity, entityState[entity]?.sortColumns, entityState[entity]?.page]);

	const requestRefetch = (state: Partial<DataState>) => {
		state.sortColumns ? requestSort(state) : incrementPage();
	};

	// TODO: Get warning in here that navigate should be in a useEffect
	const requestSort = (state: Partial<DataState>) => {
		navigate(routeFor({ entity, sort: state.sortColumns }));
	};

	// Increment page only; leave the rest
	const incrementPage = () => {
		setDataState(entity, { page: (entityState[entity]?.page ?? defaultEntityState.page) + 1 });
	};

	const { loading, error, data, sortColumns, eof } = entityState[entity] ?? defaultEntityState;
	if (loading) {
		return <pre>Loading...</pre>;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	return (
		<>
			<Table rows={data} orderBy={sortColumns} requestRefetch={requestRefetch} eof={eof} />
			<DetailPanel />
		</>
	);
};
