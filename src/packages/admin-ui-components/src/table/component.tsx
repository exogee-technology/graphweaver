import { useCallback, useRef } from 'react';
import {
	ColumnDef,
	ColumnSort,
	Row,
	RowSelectionState,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table';
import clsx from 'clsx';

import { ChevronDownIcon } from '../assets';
import styles from './styles.module.css';
import { Sort, SortEntity } from '../utils';
import { Spinner, SpinnerSize } from '../spinner';

type Props<T> = {
	loading: boolean;
	data: T[];
	columns: ColumnDef<T, any>[];
	primaryKeyField: string;
	sort?: SortEntity;
	onRowClick?: (row: Row<T>) => void;
	onSortClick?: (sort: SortEntity) => void;
	fetchNextPage?: () => void;
	onRowSelectionChange?: (selectedRows: RowSelectionState) => void;
	rowSelection?: RowSelectionState;
};

export const Table = <T extends object>({
	loading,
	data,
	sort,
	columns,
	onRowClick,
	onSortClick,
	fetchNextPage,
	onRowSelectionChange,
	rowSelection,
	primaryKeyField,
}: Props<T>) => {
	//we need a reference to the scrolling element for infinite scrolling
	const tableContainerRef = useRef<HTMLDivElement>(null);

	// Convert our sorting object to the format required by react-table
	const sorting: ColumnSort[] = Object.entries(sort ?? {}).map(([field, direction]) => ({
		id: field,
		desc: direction === Sort.DESC,
	}));

	const handleRowClick = (row: Row<T>) => {
		if (onRowClick) onRowClick(row);
	};

	const handleSortClick = (sortingState: ColumnSort[]) => {
		// TODO We currently only support single column sorting
		const [firstSortedColumn] = sortingState ?? [];
		if (firstSortedColumn?.id) {
			onSortClick?.({
				[firstSortedColumn.id]: firstSortedColumn.desc ? Sort.DESC : Sort.ASC,
			});
		}
	};

	const scrolledToEnd = (containerRefElement: HTMLDivElement): boolean => {
		// Return true when the scrollTop reaches the bottom ...
		const { scrollHeight, scrollTop, clientHeight } = containerRefElement;
		const tolerance = 175; // trigger when 5 rows from the end
		const distanceFromTop = Math.round(scrollTop) + tolerance;
		const atEndOfSet = distanceFromTop >= scrollHeight - clientHeight;
		return atEndOfSet;
	};

	//called on scroll and possibly on mount to fetch more data as the user scrolls and reaches bottom of table
	const fetchMoreOnBottomReached = useCallback(
		(containerRefElement?: HTMLDivElement | null) => {
			if (containerRefElement) {
				if (loading || !scrolledToEnd(containerRefElement)) return;

				fetchNextPage?.();
			}
		},
		[fetchNextPage]
	);

	const table = useReactTable({
		data,
		columns,
		manualSorting: true,
		getRowId: (row) => row[primaryKeyField as keyof typeof row] as string,
		onSortingChange: (updater) => {
			const newSortingValue = (updater as any)?.();
			handleSortClick(newSortingValue);
		},
		onRowSelectionChange: (updater) => {
			const newSelectedRows = updater instanceof Function ? updater(rowSelection ?? {}) : updater;
			onRowSelectionChange?.(newSelectedRows);
		},
		state: {
			sorting,
			rowSelection,
		},
		enableRowSelection: true,
		getCoreRowModel: getCoreRowModel(),
	});

	return (
		<div
			className={styles.container}
			onScroll={(e) => fetchMoreOnBottomReached(e.target as HTMLDivElement)}
			ref={tableContainerRef}
		>
			<div className={styles.table}>
				<table data-testid="table">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className={clsx(header.column.getCanSort() && styles.sortable)}
										{...(header.column.getCanSort()
											? {
													onClick: header.column.getToggleSortingHandler(),
												}
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
						{table.getRowModel().rows.map((row) => (
							<tr
								key={row.id}
								className={clsx(onRowClick && styles.clickable)}
								onClick={(e) => {
									if (
										!(e.target as HTMLElement).closest('label') &&
										!(e.target as HTMLElement).closest('input')
									) {
										handleRowClick(row);
									}
								}}
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
								<th colSpan={footerGroup.headers.length}>
									{loading ? <Spinner size={SpinnerSize.SMALL} /> : null}
								</th>
							</tr>
						))}
					</tfoot>
				</table>
			</div>
		</div>
	);
};
