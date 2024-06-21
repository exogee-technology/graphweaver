import { useQuery } from '@apollo/client';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
	PAGE_SIZE,
	SortEntity,
	SortField,
	Span,
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
import { useMemo } from 'react';

const columnHelper = createColumnHelper<any>();

// const columns: ColumnDef<Span, any>[] = [
// 	columnHelper.accessor('timestamp', {
// 		cell: (info) => {
// 			const timestamp = UnixNanoTimeStamp.fromString(info.getValue());
// 			return <span>{timestamp.toDate().toLocaleString()}</span>;
// 		},
// 		header: () => 'Timestamp',
// 	}),
// 	columnHelper.accessor('name', {
// 		header: () => 'Name',
// 	}),
// 	columnHelper.accessor((row) => row.attributes?.type, {
// 		id: 'type',
// 		header: () => 'Type',
// 		cell: (info) => {
// 			const attributes = info.getValue();
// 			return attributes?.type ?? '';
// 		},
// 	}),
// 	columnHelper.accessor('duration', {
// 		header: () => 'Duration',
// 		cell: (info) => {
// 			const duration = UnixNanoTimeStamp.fromString(info.getValue());
// 			const { value, unit } = duration.toSIUnits();
// 			return (
// 				<span>
// 					{Number(value).toFixed(2)} {unit}
// 				</span>
// 			);
// 		},
// 	}),
// 	columnHelper.accessor('traceId', {
// 		header: () => 'Trace ID',
// 		cell: (info) => info.getValue(),
// 	}),
// 	columnHelper.accessor((row) => row.attributes?.method, {
// 		id: 'method',
// 		header: () => 'Method',
// 		cell: (info) => {
// 			const attributes = info.getValue();
// 			return attributes?.method ?? '';
// 		},
// 	}),
// ];

export const EntityList = <TData extends object>() => {
	const { entity, id } = useParams();
	if (!entity) throw new Error('There should always be an entity at this point.');

	const navigate = useNavigate();
	const { entityByName } = useSchema();
	const [search] = useSearchParams();
	const { sort: sorting, page, filters } = decodeSearchParams(search);

	const { fields, defaultSort, primaryKeyField } = entityByName(entity);

	const sort = getOrderByQuery({ sort: sorting, defaultSort, primaryKeyField });

	const variables = {
		pagination: {
			offset: Math.max(page - 1, 0) * PAGE_SIZE,
			limit: PAGE_SIZE,
			orderBy: sort,
		},
		...(filters
			? {
					filter: {
						...filters,
						parentId: null,
					},
				}
			: { filter: { parentId: null } }),
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

	if (loading) {
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
		console.log(newSort);
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
				<ListToolBar />
			</Header>
			<Table
				data={convertRowData(data, fields)}
				columns={columns}
				sort={sort}
				onRowClick={handleRowClick}
				onSortClick={handleSortClick}
			/>
		</div>
	);
};
