import DataGrid, {
	Column,
	FormatterProps,
	Row,
	RowRendererProps,
	SortColumn,
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
	EntityFieldType,
} from '../utils';
import { Spinner } from '../spinner';

import 'react-data-grid/lib/styles.css';
// These are direct class name overrides to the styles above ^, so they're not in our styles.module.css
import './table-styles.css';
import styles from './styles.module.css';
import { Loader } from '../loader';
import { ApolloError } from '@apollo/client';

import { customFields } from 'virtual:graphweaver-user-supplied-custom-fields';

const columnsForEntity = <T,>(
	entity: Entity,
	entityByType: (type: string) => Entity
): Column<T, unknown>[] => {
	const entityColumns = entity.fields.map((field) => ({
		key: field.name,
		name: field.name,
		width:
			field.type === EntityFieldType.ID || field.type === EntityFieldType.OPTIONAL_ID ? 20 : 200,

		// We don't support sorting by relationships yet.
		sortable: !field.relationshipType,

		// We only need a formatter for relationships.
		formatter: field.relationshipType
			? ({ row }: FormatterProps<T, unknown>) => {
					// Without stopping propagation on our links, the grid will be notified about the click,
					// which is not what we want. We want to navigate and not let the grid handle it
					const gobbleEvent = useCallback(
						(e: MouseEvent<HTMLAnchorElement>) => e.stopPropagation(),
						[]
					);
					const value = row[field.name as keyof typeof row];
					const relatedEntity = entityByType(field.type);

					const linkForValue = (value: any) => (
						<Link
							key={value.id}
							to={routeFor({ type: field.type, id: value.id as string })}
							onClick={gobbleEvent}
						>
							{value[relatedEntity?.summaryField || 'id'] || value.label}
						</Link>
					);

					if (Array.isArray(value)) {
						// We're in a many relationship. Return an array of links.
						return value.map(linkForValue);
					} else if (value) {
						return linkForValue(value);
					} else {
						return null;
					}
			  }
			: undefined,
	}));

	// Let's check if there are custom fields to add
	const customFieldsForEntity = customFields?.get(entity.name);
	if (customFieldsForEntity) {
		// Covert the custom fields to columns
		const customColumns =
			customFieldsForEntity.map((field) => ({
				key: field.name,
				name: field.name,
				width: 200,
				sortable: false,
				formatter: ({ row }: FormatterProps<T, unknown>) => field?.component?.(row),
			})) || [];

		// Add the custom columns to the existing table taking into account any supplied index
		for (const field of customFieldsForEntity) {
			const customCol = customColumns.shift();
			if (customCol) entityColumns.splice(field.index ?? entityColumns.length, 0, customCol);
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

	const scrolledToEnd = (event: React.UIEvent<Element>): boolean => {
		// Return true when the scrollTop reaches the bottom ...
		const { currentTarget } = event;
		const target = currentTarget as Element;
		const atEndOfSet = target.scrollTop >= currentTarget.scrollHeight - currentTarget.clientHeight;
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

	const handleSort = () => {
		requestRefetch({
			sortFields: sortColumns.map((c) => ({ field: c.columnKey, direction: c.direction })),
		});
	};

	useEffect(() => {
		handleSort();
	}, [sortColumns]);

	const navigateToDetailForEntity = useCallback(
		(row: T) => {
			if (!selectedEntity) throw new Error('Selected entity is required to navigate');
			// Don't set the filter in the route
			const { filters, sort } = decodeSearchParams(search);
			navigate(routeFor({ entity: selectedEntity, id: row.id, sort, filters }));
		},
		[search, selectedEntity]
	);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	if (loading) {
		return <Loader />;
	}
	if (error) {
		return <pre>{`Error! ${error.message}`}</pre>;
	}

	return (
		<>
			<DataGrid
				columns={columnsForEntity<T>(selectedEntity, entityByType)}
				rows={rows}
				rowKeyGetter={rowKeyGetter}
				sortColumns={sortColumns}
				onSortColumnsChange={setSortColumns}
				defaultColumnOptions={{ resizable: true }}
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
		</>
	);
};
