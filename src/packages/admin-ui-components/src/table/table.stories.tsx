import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { createColumnHelper } from '@tanstack/react-table';

import { Table } from './component';
import { Sort } from '../utils';

// Create a mock data type for our examples
interface Person {
	id: string;
	firstName: string;
	lastName: string;
	age: number;
	visits: number;
	status: 'relationship' | 'complicated' | 'single';
	lastVisit: string;
}

// Sample data
const data: Person[] = [
	{
		id: '1',
		firstName: 'John',
		lastName: 'Doe',
		age: 32,
		visits: 4,
		status: 'single',
		lastVisit: '2023-05-10',
	},
	{
		id: '2',
		firstName: 'Jane',
		lastName: 'Smith',
		age: 27,
		visits: 8,
		status: 'relationship',
		lastVisit: '2023-06-15',
	},
	{
		id: '3',
		firstName: 'Bob',
		lastName: 'Johnson',
		age: 45,
		visits: 2,
		status: 'complicated',
		lastVisit: '2023-04-22',
	},
	{
		id: '4',
		firstName: 'Alice',
		lastName: 'Williams',
		age: 29,
		visits: 12,
		status: 'relationship',
		lastVisit: '2023-07-01',
	},
	{
		id: '5',
		firstName: 'Michael',
		lastName: 'Brown',
		age: 38,
		visits: 5,
		status: 'single',
		lastVisit: '2023-03-18',
	},
];

// Column helper for type safety
const columnHelper = createColumnHelper<Person>();

// Default columns
const defaultColumns = [
	columnHelper.accessor('firstName', {
		header: 'First Name',
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor('lastName', {
		header: 'Last Name',
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor('age', {
		header: 'Age',
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor('visits', {
		header: 'Visits',
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor('status', {
		header: 'Status',
		cell: (info) => info.getValue(),
	}),
	columnHelper.accessor('lastVisit', {
		header: 'Last Visit',
		cell: (info) => info.getValue(),
	}),
];

// Column with selection checkbox
const columnsWithSelection = [
	columnHelper.display({
		id: 'select',
		header: ({ table }) => (
			<input
				type="checkbox"
				checked={table.getIsAllRowsSelected()}
				onChange={table.getToggleAllRowsSelectedHandler()}
			/>
		),
		cell: ({ row }) => (
			<div style={{ textAlign: 'center' }}>
				<input
					type="checkbox"
					checked={row.getIsSelected()}
					onChange={row.getToggleSelectedHandler()}
				/>
			</div>
		),
		size: 40,
	}),
	...defaultColumns,
];

const meta = {
	title: 'Display/Table',
	component: Table,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		loading: { control: 'boolean' },
	},
	decorators: [(Story) => <div style={{ height: '400px' }}>{Story()}</div>],
} as Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic table
export const Default: Story = {
	args: {
		data,
		columns: defaultColumns,
		loading: false,
		primaryKeyField: 'id',
	},
};

// Table in loading state
export const Loading: Story = {
	args: {
		data,
		columns: defaultColumns,
		loading: true,
		primaryKeyField: 'id',
	},
};

// Component for Sortable story
const SortableTable = () => {
	const [sort, setSort] = useState<Record<string, Sort>>({
		firstName: Sort.ASC,
	});

	// Create sortable columns
	const sortableColumns = defaultColumns.map((col) => ({
		...col,
		enableSorting: true,
	}));

	return (
		<Table
			data={data}
			columns={sortableColumns}
			loading={false}
			primaryKeyField="id"
			sort={sort}
			onSortClick={(newSort) => setSort(newSort)}
		/>
	);
};

// Table with sorting
export const Sortable: Story = {
	render: () => <SortableTable />,
};

// Component for RowSelection story
const RowSelectionTable = () => {
	const [rowSelection, setRowSelection] = useState({});
	const [selectedData, setSelectedData] = useState<Person[]>([]);

	const handleRowSelectionChange = (newSelection: Record<string, boolean>) => {
		setRowSelection(newSelection);

		// Get selected data for display
		const selectedIds = Object.keys(newSelection).filter((id) => newSelection[id]);
		setSelectedData(data.filter((item) => selectedIds.includes(item.id)));
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
			<Table
				data={data}
				columns={columnsWithSelection}
				loading={false}
				primaryKeyField="id"
				rowSelection={rowSelection}
				onRowSelectionChange={handleRowSelectionChange}
			/>

			{Object.keys(rowSelection).length > 0 && (
				<div
					style={{ padding: '10px', background: 'rgba(124, 93, 199, 0.1)', borderRadius: '6px' }}
				>
					<h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#e0dde5' }}>
						Selected Rows ({Object.keys(rowSelection).length})
					</h3>
					<pre
						style={{
							margin: 0,
							fontSize: '12px',
							color: '#e0dde5',
							overflow: 'auto',
							maxHeight: '100px',
						}}
					>
						{JSON.stringify(selectedData, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
};

// Table with row selection
export const RowSelection: Story = {
	render: () => <RowSelectionTable />,
};

// Component for RowClickable story
const RowClickableTable = () => {
	const [selectedRow, setSelectedRow] = useState<Person | null>(null);

	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
			<Table
				data={data}
				columns={defaultColumns}
				loading={false}
				primaryKeyField="id"
				onRowClick={(row) => setSelectedRow(row.original)}
			/>

			{selectedRow && (
				<div
					style={{ padding: '10px', background: 'rgba(124, 93, 199, 0.1)', borderRadius: '6px' }}
				>
					<h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#e0dde5' }}>Selected Row</h3>
					<pre style={{ margin: 0, fontSize: '12px', color: '#e0dde5' }}>
						{JSON.stringify(selectedRow, null, 2)}
					</pre>
				</div>
			)}
		</div>
	);
};

// Table with row click handler
export const RowClickable: Story = {
	render: () => <RowClickableTable />,
};

// Empty table
export const Empty: Story = {
	args: {
		data: [],
		columns: defaultColumns,
		loading: false,
		primaryKeyField: 'id',
	},
};
