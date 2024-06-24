import { useQuery } from '@apollo/client';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';

import {
	PAGE_SIZE,
	SortEntity,
	SortField,
	UnixNanoTimeStamp,
	decodeSearchParams,
	getOrderByQuery,
	routeFor,
	useSchema,
} from '../utils';
import { convertRowData } from './utils';
import { Table } from '../table';
import { Loader } from '../loader';
import { Header } from '../header';
import { QueryResponse, queryForEntityPage } from './graphql';
import { ListToolBar } from '../list-toolbar';

import styles from './styles.module.css';

const columnHelper = createColumnHelper<any>();

export const EntityList = <TData extends object>() => {
	const { entity, id } = useParams();
	if (!entity) throw new Error('There should always be an entity at this point.');

	const navigate = useNavigate();
	const { entityByName } = useSchema();
	const [search] = useSearchParams();
	const { sort: sorting, filters } = decodeSearchParams(search);

	const { fields, defaultSort, primaryKeyField, defaultFilter } = entityByName(entity);

	const sort = getOrderByQuery({ sort: sorting, defaultSort, primaryKeyField });

	const variables = {
		pagination: {
			offset: 0,
			limit: PAGE_SIZE,
			orderBy: sort,
		},
		...(filters
			? {
					filter: {
						...filters,
					},
				}
			: { filter: defaultFilter }),
	};

	const { data, loading, error, fetchMore } = useQuery<QueryResponse<TData>>(
		queryForEntityPage(entity, entityByName),
		{
			variables,
			notifyOnNetworkStatusChange: true,
		}
	);

	const columns = useMemo(
		() => fields.map((field) => columnHelper.accessor(field.name, { header: () => field.name })),
		[]
	);

	const handleFetchNextPage = async () => {
		const moreData = (data?.result.length ?? 0) < (data?.aggregate?.count ?? 0);
		console.log(data?.result.length, data?.aggregate?.count, moreData, !loading);
		if (!loading && moreData) {
			const nextPage = Math.ceil((data?.result.length ?? 0) / PAGE_SIZE);
			fetchMore({
				variables: {
					...variables,
					pagination: {
						...variables.pagination,
						offset: nextPage * PAGE_SIZE,
					},
					filter: {
						...variables.filter,
						timestamp_lte: (data?.result[0] as any).timestamp,
					},
				},
			});
		}
	};

	console.log(data);

	if (loading && !data) {
		return <Loader />;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}
	if (!data) {
		return <pre>{`Error! Unable to load entity.`}</pre>;
	}

	const handleRowClick = <T extends object>(row: Row<T>) => {
		// TODO: Navigate to the detail page this ID should be generic
		const primaryKeyField = 'traceId';
		navigate(`${row.original[primaryKeyField as keyof T]}`);
	};

	const handleSortClick = (newSort: SortEntity) => {
		navigate(
			routeFor({
				entity,
				filters,
				sort: newSort as unknown as SortField[], // TODO this cast should be removed when we fix the sort type in the url
				id,
			})
		);
	};

	return (
		<div className={styles.wrapper}>
			<Header>
				<ListToolBar count={data.aggregate?.count} />
			</Header>
			<Table
				data={convertRowData(data, fields)}
				columns={columns}
				sort={sort}
				onRowClick={handleRowClick}
				onSortClick={handleSortClick}
				fetchNextPage={handleFetchNextPage}
			/>
		</div>
	);
};
