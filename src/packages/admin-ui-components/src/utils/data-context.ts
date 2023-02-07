import { ApolloError } from '@apollo/client';
import { createContext } from 'react';

import { Filter, SortField } from '.';

type DataType = { id: string };

export interface DataState {
	data: DataType[];
	filterField: Filter;
	sortFields: SortField[];
	page: number;
	loading: boolean;
	error?: ApolloError;
	allDataFetched: boolean;
}

export type DataStateByEntity = Record<string, DataState>;

export const defaultEntityState = {
	data: [],
	sortFields: [],
	filterField: { filter: undefined },
	page: 1,
	loading: false,
	error: undefined,
	allDataFetched: false,
};

// export const DataContext = createContext<DataStateByEntity>({});
// @todo: Combine with useReducer. currently this is set up in Router to put entityState/setEntityState into the context
// Typescript demands that these are properly typed
export const DataContext = createContext({} as any);
