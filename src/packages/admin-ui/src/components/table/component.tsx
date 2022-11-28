import DataGrid, { Column, SortColumn } from 'react-data-grid';
import { useCallback, useState, MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import 'react-data-grid/lib/styles.css';
// These are direct class name overrides to the styles above ^, so they're not in our styles.module.css
import './table-styles.css';

import styles from './styles.module.css';
import { Entity, useSchema } from '~/utils/use-schema';
import { useSelectedEntity } from '~/utils/use-selected-entity';
import { routeFor } from '~/utils/route-for';

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

					if (Array.isArray(value)) {
						// We're in a many relationship. Return an array of links.
						return (
							<>
								{value.map((value) => (
									<Link
										key={value.id}
										to={routeFor({ type: field.type, id: value.id as string })}
										onClick={gobbleEvent}
									>
										{value[relatedEntity?.summaryField || 'id']}
									</Link>
								))}
							</>
						);
					} else if (value) {
						return (
							<Link
								to={routeFor({ type: field.type, id: (value as any).id as string })}
								onClick={gobbleEvent}
							>
								{(value as any)[relatedEntity?.summaryField || 'id']}
							</Link>
						);
					} else {
						return null;
					}
			  }
			: undefined,
	}));

export const Table = <T extends { id: string }>({ rows }: { rows: T[] }) => {
	const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
	const navigate = useNavigate();
	const { entityByType } = useSchema();
	const { selectedEntity } = useSelectedEntity();

	const rowKeyGetter = useCallback((row: T) => row.id, []);
	const navigateToDetailForEntity = useCallback(
		(row: T) => {
			if (!selectedEntity) throw new Error('Selected entity is required to navigate');
			navigate(routeFor({ entity: selectedEntity, id: row.id }));
		},
		[selectedEntity]
	);

	if (!selectedEntity) throw new Error('There should always be a selected entity at this point.');

	return (
		<div className={styles.tableWrapper}>
			<DataGrid
				columns={columnsForEntity(selectedEntity, entityByType) as any}
				rows={rows}
				rowKeyGetter={rowKeyGetter}
				sortColumns={sortColumns}
				onSortColumnsChange={setSortColumns}
				defaultColumnOptions={{ resizable: true }}
				onRowClick={navigateToDetailForEntity}
			/>
		</div>
	);
};
