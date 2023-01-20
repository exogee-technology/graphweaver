import DataGrid, { Column, SortColumn } from 'react-data-grid';
import React, { useCallback, useState, MouseEvent, UIEventHandler, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import 'react-data-grid/lib/styles.css';
// These are direct class name overrides to the styles above ^, so they're not in our styles.module.css
import './table-styles.css';

import styles from './styles.module.css';
import { Entity, useSchema } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';
import { routeFor } from '~/utils/route-for';
import { Spinner } from '..';

const columnsForEntity = <T extends { id: string }>(
	entity: Entity,
	entityByType: (type: string) => Entity
): Column<T>[] =>
	entity.fields.map((field) => ({
		key: field.name,
		name: field.name,
		width: field.type === 'ID!' || field.type === 'ID' ? 20 : 200,

		// We don't support sorting by relationships yet.
		sortable: !field.relationshipType,

		// We only need a formatter for relationships.
		formatter: field.relationshipType
			? ({ row }) => {
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
							{value[relatedEntity?.summaryField || 'id']}
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

export const Table = <T extends { id: string }>({
	rows,
	orderBy = [],
	refetch,
	eof,
}: {
	rows: T[];
	orderBy: SortColumn[];
	refetch: ({ sortColumns }: { sortColumns?: SortColumn[] }) => void;
	eof: boolean;
}) => {
	const [sortColumns, setSortColumns] = useState<SortColumn[]>(orderBy);
	const navigate = useNavigate();
	const { id } = useParams();
	const { entityByType } = useSchema();
	const { selectedEntity } = useSelectedEntity();
	const rowKeyGetter = useCallback((row: T) => row.id, []);
	const rowClass = useCallback((row: T) => (row.id === id ? 'rdg-row-selected' : undefined), [id]);
	const [isLoading, setLoading] = useState(false);
	const [endOfSet, setEndOfSet] = useState(false);

	const scrolledToEnd = ({ currentTarget }: React.UIEvent): boolean => {
		// Return true when the scrollTop reaches 10 over the bottom ...
		const approachingEndOfSet =
			currentTarget.scrollTop + 10 >= currentTarget.scrollHeight - currentTarget.clientHeight;
		setEndOfSet(approachingEndOfSet);
		return approachingEndOfSet;
	};

	const handleScroll: UIEventHandler<HTMLDivElement> = async (event: React.UIEvent) => {
		// Do nothing if we aren't at the last row, or if we're currently loading...
		// Also do nothing if EOF detected (no more rows to load)
		if (isLoading || !scrolledToEnd(event) || eof) {
			return;
		}

		// TODO: Does not prevent a race condition. All this call does is trigger a reload, but really we want
		// TODO: the reload to complete before setting loading to false
		setLoading(true);
		refetch({});
		// TODO: So...
		setTimeout(() => setLoading(false), 500);
	};

	const handleSort = () => {
		refetch({ sortColumns });
	};

	useEffect(() => {
		handleSort();
	}, [sortColumns]);

	const navigateToDetailForEntity = useCallback(
		(row: T) => {
			if (!selectedEntity) throw new Error('Selected entity is required to navigate');
			navigate(routeFor({ entity: selectedEntity, id: row.id }));
		},
		[selectedEntity]
	);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	return (
		<>
			<DataGrid
				columns={columnsForEntity(selectedEntity, entityByType) as any}
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
			{!(isLoading || endOfSet || eof) && (
				<div className={styles.spinner}>
					<Spinner />
				</div>
			)}
		</>
	);
};
