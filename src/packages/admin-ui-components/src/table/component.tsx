import DataGrid, {
	Column,
	FormatterProps,
	SortColumn,
	SelectColumn,
	CalculatedColumn,
} from 'react-data-grid';
import React, { useCallback, useState, MouseEvent, UIEventHandler, useEffect } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';

import {
	Entity,
	useSchema,
	useSelectedEntity,
	routeFor,
	SortField,
	decodeSearchParams,
} from '../utils';
import { Spinner } from '../spinner';

import 'react-data-grid/lib/styles.css';
// These are direct class name overrides to the styles above ^, so they're not in our styles.module.css
import './table-styles.css';
import styles from './styles.module.css';
import { Loader } from '../loader';
import { ApolloError, useMutation } from '@apollo/client';

import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';
import { Button } from '../button';
import { Modal } from '../modal';
import {
	generateDeleteEntityMutation,
	generateDeleteManyEntitiesMutation,
} from '../detail-panel/graphql';
import toast from 'react-hot-toast';
import { SelectionBar } from '../selection-bar';

// Without stopping propagation on our links, the grid will be notified about the click,
// which is not what we want. We want to navigate and not let the grid handle it
const gobbleEvent = (e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation();

const hideImage = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
	e.currentTarget.style.display = 'none';
};

const columnsForEntity = <T extends TableRowItem>(
	entity: Entity,
	entityByType: (type: string) => Entity
): Column<T, unknown>[] => {
	const entityColumns = [
		...(entity.attributes.isReadOnly ? [] : [SelectColumn]),
		...entity.fields.map((field) => ({
			key: field.name,
			name: field.name,
			width: field.type === 'ID!' || field.type === 'ID' ? 20 : 200,

			// We don't support sorting by relationships yet.
			sortable: !field.relationshipType,

			formatter: field.relationshipType
				? ({ row }: FormatterProps<T, unknown>) => {
						const value = row[field.name as keyof typeof row];
						const relatedEntity = entityByType(field.type);

						const linkForValue = (value: any) =>
							relatedEntity ? (
								<Link
									key={value.value}
									to={routeFor({ type: field.type, id: value.value as string })}
									onClick={gobbleEvent}
								>
									{value.label}
								</Link>
							) : (
								value.label
							);

						if (Array.isArray(value)) {
							// We're in a many relationship. Return an array of links.
							return value.flatMap((item) => [linkForValue(item), ', ']).slice(0, -1);
						} else if (value) {
							return linkForValue(value);
						} else {
							return null;
						}
					}
				: field.type === 'Image'
					? ({ row }: FormatterProps<T, unknown>) => {
							const imageUrl = row[field.name as keyof typeof row] as string;

							return (
								<img
									src={imageUrl}
									// alt={altText} @todo - implement alt text
									style={{
										width: '100%',
										height: '100%',
										objectFit: 'cover',
										padding: 2,
										borderRadius: 8,
										objectPosition: 'center center',
										textIndent: -9999,
									}}
									onError={hideImage}
								/>
							);
						}
					: field.type === 'Media'
						? ({ row }: FormatterProps<T, unknown>) => {
								const mediaUrl = row[field.name as keyof typeof row] as string;
								return (
									<a href={mediaUrl} target="_blank" rel="noreferrer">
										{mediaUrl}
									</a>
								);
							}
						: field.isArray
							? ({ row }: FormatterProps<T, unknown>) => {
									const value = row[field.name as keyof typeof row];
									if (Array.isArray(value)) {
										return value.join(', ');
									}
									return value;
								}
							: undefined,
		})),
	];

	// Which custom fields do we need to show here?
	const customFieldsToShow = (customFields?.get(entity.name) || []).filter((customField) => {
		const { table: show } = customField.showOn ?? { table: true };
		return show;
	});

	// Remove any fields that the user intends to replace with a custom field so
	// their custom field indices are correct regardless of insertion order
	for (const customField of customFieldsToShow) {
		const index = entityColumns.findIndex((column) => column.name === customField.name);
		if (index !== -1) {
			entityColumns.splice(index, 1);
		}
	}

	// Ok, now we can merge our custom fields in
	for (const customField of customFieldsToShow) {
		if (!customField.hideOnTable) {
			entityColumns.splice(customField.index ?? entityColumns.length, 0, {
				key: customField.name,
				name: customField.name,
				width: 200,
				sortable: false,
				formatter: ({ row }: FormatterProps<T, unknown>) =>
					customField.component?.({ context: 'table', entity: row }),
			});
		}
	}

	return entityColumns;
};

export interface TableRowItem {
	id: string;
}

export interface RequestRefetchOptions {
	sortFields?: SortField[];
}

export interface TableProps<T extends TableRowItem> {
	rows: T[];
	requestRefetch: (options: RequestRefetchOptions) => void;
	orderBy: SortField[];
	loading: boolean;
	loadingNext: boolean;
	error?: ApolloError;
}

export const Table = <T extends TableRowItem>({
	rows,
	requestRefetch,
	orderBy = [],
	loading,
	loadingNext = false,
	error,
}: TableProps<T>) => {
	const [sortColumns, setSortColumns] = useState<SortColumn[]>(
		orderBy.map((f) => ({ columnKey: f.field, direction: f.direction }))
	);
	const navigate = useNavigate();
	const { id } = useParams();
	const { entityByType } = useSchema();
	const { selectedEntity } = useSelectedEntity();
	const [search] = useSearchParams();
	const rowKeyGetter = useCallback((row: T) => row.id, []);
	const rowClass = useCallback((row: T) => (row.id === id ? 'rdg-row-selected' : undefined), [id]);
	const [selectedRows, setSelectedRows] = useState((): ReadonlySet<string> => new Set());
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	const [deleteEntities] = useMutation(generateDeleteManyEntitiesMutation(selectedEntity));

	const scrolledToEnd = (event: React.UIEvent<Element>): boolean => {
		// Return true when the scrollTop reaches the bottom ...
		const { currentTarget } = event;
		const target = currentTarget as Element;
		const tolerance = 175; // trigger when 5 rows from the end
		const distanceFromTop = Math.round(target.scrollTop) + tolerance;
		const atEndOfSet = distanceFromTop >= currentTarget.scrollHeight - currentTarget.clientHeight;
		return atEndOfSet;
	};

	const handleScroll: UIEventHandler<HTMLDivElement> = async (event: React.UIEvent) => {
		// Do nothing if we aren't at the last row, or if we're currently loading...
		// Also do nothing if EOF detected (no more rows to load)
		if (loadingNext || !scrolledToEnd(event)) {
			return;
		}
		requestRefetch({});
	};

	const handleSort = (newSortColumns: SortColumn[]) => {
		setSortColumns(newSortColumns);

		requestRefetch({
			sortFields: newSortColumns.map((c) => ({
				field: c.columnKey,
				direction: c.direction,
			})),
		});
	};

	const navigateToDetailForEntity = useCallback(
		(row: T, column: CalculatedColumn<T, unknown>) => {
			// Don't navigate if the user has clicked the checkbox column
			if (column.key === 'select-row') {
				return;
			}

			if (!selectedEntity) throw new Error('Selected entity is required to navigate');
			// Don't set the filter in the route
			const { filters, sort } = decodeSearchParams(search);
			navigate(routeFor({ entity: selectedEntity, id: row.id, sort, filters }));
		},
		[search, selectedEntity]
	);

	if (loading) {
		return <Loader />;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	const handleSelectedRowsChange = (selectedRows: Set<string>) => {
		setSelectedRows(selectedRows);
	};

	const handleDelete = () => {
		setShowDeleteConfirmation(true);
	};

	const handleDeleteEntities = () => {
		const ids = Array.from(selectedRows);

		const result = deleteEntities({
			variables: { ids },
			refetchQueries: [`AdminUIListPage`],
		});

		setSelectedRows(new Set());
		setShowDeleteConfirmation(false);

		result
			.then(() => {
				toast.success(
					<div className={styles.successToast}>
						<div>Success</div> <div className={styles.deletedText}>Rows deleted</div>
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

	return (
		<>
			<DataGrid
				columns={columnsForEntity<T>(selectedEntity, entityByType)}
				rows={rows}
				rowKeyGetter={rowKeyGetter}
				sortColumns={sortColumns}
				onSortColumnsChange={handleSort}
				defaultColumnOptions={{ resizable: true }}
				onSelectedRowsChange={setSelectedRows}
				selectedRows={selectedRows}
				onRowClick={navigateToDetailForEntity}
				rowClass={rowClass}
				onScroll={handleScroll}
				className={styles.tableWrapper}
			/>
			{loadingNext && (
				<div className={styles.spinner}>
					<Spinner />
				</div>
			)}
			<Modal
				isOpen={showDeleteConfirmation}
				hideCloseX
				className={styles.deleteEntitiesModal}
				modalContent={
					<div>
						<div className={styles.deleteEntitiesModalTitle}>
							Delete {selectedRows.size} row{selectedRows.size > 1 ? 's' : ''}
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

			{selectedRows.size > 0 && (
				<SelectionBar
					selectedRows={selectedRows}
					setSelectedRows={handleSelectedRowsChange}
					handleDelete={handleDelete}
				/>
			)}
		</>
	);
};
