import DataGrid, { SortColumn } from 'react-data-grid';
import { useMemo, useState } from 'react';

import 'react-data-grid/lib/styles.css';
import './table-styles.css';

import styles from './styles.module.css';

const columns = [
	{ key: 'id', name: 'ID' },
	{ key: 'title', name: 'Title' },
];

const rows = [
	{ id: 0, title: 'Example' },
	{ id: 1, title: 'Demo' },
];

export const Table = () => {
	const [sortColumns, setSortColumns] = useState<readonly SortColumn[]>([]);
	const sortedRows = useMemo((): readonly any[] => {
		if (sortColumns.length === 0) return rows;

		return [...rows].sort((a, b) => {
			for (const sort of sortColumns) {
				const left = (a as any)[sort.columnKey];
				const right = (b as any)[sort.columnKey];

				let result = 0;
				if (typeof left === 'number') result = left - right;
				else result = String(left).localeCompare(String(right));

				if (result !== 0) {
					return sort.direction === 'ASC' ? result : -result;
				}
			}
			return 0;
		});
	}, [rows, sortColumns]);

	return (
		<div className={styles.tableWrapper}>
			<DataGrid
				columns={columns}
				rows={sortedRows}
				sortColumns={sortColumns}
				onSortColumnsChange={setSortColumns}
				defaultColumnOptions={{
					sortable: true,
					resizable: true,
				}}
			/>
		</div>
	);
};
