import { useMutation, useQuery } from '@apollo/client';
import { addStabilizationToFilter } from '@exogee/graphweaver-apollo-client';
import { Row, RowSelectionState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Outlet, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import { Button } from '../button';
import { generateDeleteManyEntitiesMutation } from '../detail-panel/graphql';
import { ErrorView } from '../error-view';
import { Header } from '../header';
import { ListToolBar } from '../list-toolbar';
import { Modal } from '../modal';
import { SelectionBar } from '../selection-bar';
import { Table } from '../table';
import {
	PAGE_SIZE,
	SortEntity,
	decodeSearchParams,
	getOrderByQuery,
	routeFor,
	useSchema,
} from '../utils';
import { convertEntityToColumns } from './columns';
import { QueryResponse, queryForEntityPage } from './graphql';

import { ExportModal } from '../export-modal';
import styles from './styles.module.css';

export const EntityList = <TData extends object>() => {
	const { entity: entityName, id } = useParams();
	if (!entityName) throw new Error('There should always be an entity at this point.');

	const navigate = useNavigate();
	const { entityByName, entityByType } = useSchema();
	const [search] = useSearchParams();
	const { sort: sorting, filters } = decodeSearchParams(search);
	const entity = entityByName(entityName);
	const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	const [showExportModal, setShowExportModal] = useState(false);
	const [deleteEntities] = useMutation(generateDeleteManyEntitiesMutation(entity));
	const {
		fields,
		defaultSort,
		primaryKeyField,
		defaultFilter,
		fieldForDetailPanelNavigationId,
		excludeFromTracing,
		supportsPseudoCursorPagination
	} = entity;
	const columns = useMemo(
		() => convertEntityToColumns(entity, entityByType),
		[fields, entityByType]
	);

	const sort = getOrderByQuery({ sort: sorting, defaultSort, primaryKeyField });

	const variables = {
		pagination: {
			offset: 0,
			limit: PAGE_SIZE,
			orderBy: sort,
		},
		...(filters ? { filter: filters } : { filter: defaultFilter }),
	};

	const { data, loading, error, fetchMore } = useQuery<QueryResponse<TData>>(
		queryForEntityPage(entityName, entityByName),
		{
			variables,
			notifyOnNetworkStatusChange: true,
			...(excludeFromTracing
				? { context: { headers: { ['x-graphweaver-suppress-tracing']: `true` } } }
				: {}),
		}
	);

	if (error) {
		return <ErrorView message={error.message} />;
	}
	if (!loading && !data) {
		return <ErrorView message="Error! Unable to load entity." />;
	}

	const handleRowClick = <T extends object>(row: Row<T>) => {
		navigate(`${row.original[fieldForDetailPanelNavigationId as keyof T]}`);
	};

	const handleSortClick = (newSort: SortEntity) => {
		navigate(
			routeFor({
				entity,
				filters,
				sort: newSort,
				id,
			})
		);
	};

	const handleFetchNextPage = async () => {
		const nextPage = Math.ceil((data?.result.length ?? 0) / PAGE_SIZE);
		const offset = supportsPseudoCursorPagination ? 0 : nextPage * PAGE_SIZE;

		const filterVar = variables.filter ?? {};
		const filter = supportsPseudoCursorPagination ? addStabilizationToFilter(filterVar, sort, data?.result?.[data.result.length - 1]) : filterVar;
		fetchMore({
			variables: {
				...variables,
				pagination: {
					...variables.pagination,
					offset
				},
				filter
			},
		});
	};

	const handleSelectedRowsChange = (selectedRows: RowSelectionState) => {
		setSelectedRows(selectedRows);
	};

	const handleDelete = () => {
		setShowDeleteConfirmation(true);
	};

	const handleDeleteEntities = () => {
		const ids = Object.keys(selectedRows);

		const result = deleteEntities({
			variables: { ids },
			refetchQueries: [`${entity.plural}List`],
		});
		setSelectedRows({});
		setShowDeleteConfirmation(false);
		result
			.then(() => {
				toast.success(
					<div className={styles.successToast}>
						<div>Success</div>
						<div className={styles.deletedText}>Row{ids.length === 1 ? '' : 's'} deleted</div>
					</div>
				);
			})
			.catch((e) => {
				console.error(e);
				toast.error(
					<div className={styles.errorToast}>
						<div>An error occured while deleting rows</div>
					</div>
				);
			});
	};

	const handleShowExportModal = () => {
		setShowExportModal(true);
	};

	return (
		<div className={styles.wrapper}>
			<Header>
				<ListToolBar count={data?.aggregate?.count} onExportToCSV={handleShowExportModal} />
			</Header>
			<Table
				loading={loading}
				data={data?.result ?? []}
				columns={columns}
				sort={sort}
				onRowClick={handleRowClick}
				onSortClick={handleSortClick}
				fetchNextPage={handleFetchNextPage}
				rowSelection={selectedRows}
				onRowSelectionChange={handleSelectedRowsChange}
				primaryKeyField={primaryKeyField}
			/>
			<Modal
				isOpen={showDeleteConfirmation}
				hideCloseX
				className={styles.deleteEntitiesModal}
				modalContent={
					<div>
						<div className={styles.deleteEntitiesModalTitle}>
							Delete {selectedRows.size} row{Object.keys(selectedRows).length > 1 ? 's' : ''}
						</div>
						<p>Are you sure you want to delete these rows?</p>
						<p>This action cannot be undone.</p>
						<div className={styles.deleteEntitiesModalFooter}>
							<Button type="reset" onClick={() => setShowDeleteConfirmation(false)}>
								Cancel
							</Button>
							<Button type="button" onClick={handleDeleteEntities} className={styles.deleteButton}>
								Delete
							</Button>
						</div>
					</div>
				}
			/>

			{Object.keys(selectedRows).length > 0 && (
				<SelectionBar
					selectedRows={selectedRows}
					setSelectedRows={handleSelectedRowsChange}
					handleDelete={handleDelete}
				/>
			)}

			{showExportModal && (
				<ExportModal closeModal={() => setShowExportModal(false)} sort={sort} filters={filters} />
			)}
			<Outlet />
		</div>
	);
};
