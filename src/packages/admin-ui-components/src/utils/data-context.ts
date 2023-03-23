import { ApolloError } from '@apollo/client';
import { createContext } from 'react';

import { Filter, SortField } from '.';

type DataType = { id: string };

export interface DataState {
	filterFields: Filter[];
	data: DataType[];
	sortFields: SortField[];
	page: number;
	loading: boolean;
	loadingNext: boolean;
	error?: ApolloError;
	allDataFetched: boolean;
}

export const defaultEntityState = {
	data: [],
	sortFields: [],
	filterFields: [],
	page: 1,
	loading: false,
	loadingNext: false,
	error: undefined,
	allDataFetched: false,
};

type DataContextType = {
	entityState: {
		[x: string]: DataState;
	};
	setEntityState: any;
};
// @todo: Combine with useReducer. currently this is set up in DefaultLayout to put entityState/setEntityState into the context
export const DataContext = createContext({} as DataContextType);
