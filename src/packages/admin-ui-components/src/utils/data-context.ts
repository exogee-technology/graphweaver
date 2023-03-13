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
	loadingNext: boolean;
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
	loadingNext: false,
	error: undefined,
	allDataFetched: false,
};

// @todo: Combine with useReducer. currently this is set up in DefaultLayout to put entityState/setEntityState into the context
export const DataContext = createContext({} as any);
