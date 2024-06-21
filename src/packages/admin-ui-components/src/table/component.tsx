import { useState } from 'react';
import {
	ColumnDef,
	ColumnSort,
	Row,
	SortingState,
	Updater,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import clsx from 'clsx';

import { ChevronDownIcon } from '../assets';
import styles from './styles.module.css';
import { Sort, SortEntity } from '../utils';

type Props<T> = {
	data: T[];
	columns: ColumnDef<T, any>[];
	sort?: SortEntity;
	onRowClick?: (row: Row<T>) => void;
	onSortClick?: (sort: SortEntity) => void;
};

export const Table = <T extends object>({
	data,
	sort,
	columns,
	onRowClick,
	onSortClick,
}: Props<T>) => {
	// Convert our sorting object to the format required by react-table
	const sorting: ColumnSort[] = Object.entries(sort ?? {}).map(([field, direction]) => ({
		id: field,
		desc: direction === Sort.DESC,
	}));

	const handleRowClick = (row: Row<T>) => {
		if (onRowClick) onRowClick(row);
	};

	const handleSortClick = (sorting: Updater<SortingState>) => {
		const sortingState: ColumnSort | undefined = (sorting as any)?.()[0];
		console.log(sortingState, onSortClick);
		if (sortingState?.id) {
			onSortClick?.({
				[sortingState.id]: sortingState.desc ? Sort.DESC : Sort.ASC,
			});
		}
	};

	const table = useReactTable({
		data,
		columns,
		manualSorting: true,
		onSortingChange: handleSortClick,
		state: {
			sorting,
		},
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
									<th
										key={header.id}
										className={clsx()}
										{...(header.column.getCanSort()
											? { onClick: header.column.getToggleSortingHandler() }
											: {})}
									>
										<span className={styles.header}>
											{header.isPlaceholder
												? null
												: flexRender(header.column.columnDef.header, header.getContext())}
											{header.column.getIsSorted() && (
												<span
													className={clsx(
														styles.arrow,
														styles[header.column.getIsSorted() as keyof typeof styles]
													)}
												>
													<ChevronDownIcon />
												</span>
											)}
										</span>
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
