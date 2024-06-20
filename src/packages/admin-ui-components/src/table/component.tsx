import { useState } from 'react';
import { ColumnDef, Row, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';

import styles from './styles.module.css';
import clsx from 'clsx';

type Props<T> = {
	data: T[];
	columns: ColumnDef<T, any>[];
	onRowClick?: (row: Row<T>) => void;
};

export const Table = <T extends object>({ data: _data, columns, onRowClick }: Props<T>) => {
	const [data] = useState(() => [...(_data ?? [])]);

	const handleRowClick = (row: Row<T>) => {
		if (onRowClick) onRowClick(row);
	};

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div className={styles.container}>
			<div className={styles.table}>
				<table>
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row, i) => (
							<tr
								key={row.id}
								className={clsx(i % 2 && styles.rowAlternateColor, onRowClick && styles.clickable)}
								onClick={() => handleRowClick(row)}
							>
								{row.getVisibleCells().map((cell) => (
									<td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
								))}
							</tr>
						))}
					</tbody>
					<tfoot>
						{table.getFooterGroups().map((footerGroup) => (
							<tr key={footerGroup.id}>
								{footerGroup.headers.map((header) => (
									<th key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.footer, header.getContext())}
									</th>
								))}
							</tr>
						))}
					</tfoot>
				</table>
			</div>
		</div>
	);
};
