import { useQuery } from '@apollo/client';
import { Row, createColumnHelper } from '@tanstack/react-table';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

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
import { useMemo } from 'react';

const columnHelper = createColumnHelper<any>();

export const EntityList = <TData extends object>() => {
	const { entity, id } = useParams();
	if (!entity) throw new Error('There should always be an entity at this point.');

	const navigate = useNavigate();
	const { entityByName } = useSchema();
	const [search] = useSearchParams();
	const { sort: sorting, page, filters } = decodeSearchParams(search);

	const { fields, defaultSort, primaryKeyField, defaultFilter } = entityByName(entity);

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
