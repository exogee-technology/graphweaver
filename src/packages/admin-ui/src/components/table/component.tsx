import DataGrid, { Column, SortColumn } from 'react-data-grid';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

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
					const value = row[field.name as keyof typeof row];
					const relatedEntity = entityByType(field.type);

					if (Array.isArray(value)) {
						// We're in a many relationship. Return an array of links.
						return (
							<>
								{value.map((value) => (
									<Link key={value.id} to={routeFor({ type: field.type, id: value.id as string })}>
										{value[relatedEntity?.summaryField || 'id']}
									</Link>
								))}
							</>
						);
					} else if (value) {
						return (
							<Link to={routeFor({ type: field.type, id: (value as any).id as string })}>
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
	const { entityByType } = useSchema();
	const { selectedEntity } = useSelectedEntity();
	const rowKeyGetter = useCallback((row: T) => row.id, []);

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
			/>
		</div>
	);
};
