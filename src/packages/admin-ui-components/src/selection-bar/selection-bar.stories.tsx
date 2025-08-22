import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { useState } from 'react';
import { SelectionBar } from './component';
import { RowSelectionState } from '@tanstack/react-table';

const meta = {
	title: 'Display/SelectionBar',
	component: SelectionBar,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		handleDelete: { action: 'deleted' },
	},
} as Meta<typeof SelectionBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Component for Default story
const DefaultSelectionBar = (args: any) => {
	// Use React hooks to manage state in the story
	const [selectedRows, setSelectedRows] = useState<RowSelectionState>({
		'1': true,
		'2': true,
	});

	return (
		<div style={{ width: '600px', height: '200px', position: 'relative' }}>
			<SelectionBar
				selectedRows={selectedRows}
				setSelectedRows={(newSelection: RowSelectionState) => setSelectedRows(newSelection)}
				handleDelete={() => {
					args.handleDelete?.();
					// In a real app, this would delete the selected rows
					// For the story, we just clear the selection
					setSelectedRows({});
				}}
			/>
		</div>
	);
};

// Base story with wrapper to handle state
export const Default: Story = {
	render: (args) => <DefaultSelectionBar {...args} />,
	args: {
		handleDelete: fn(),
	},
};

// Component for SingleRowSelected story
const SingleRowSelectionBar = (args: any) => {
	const [selectedRows, setSelectedRows] = useState<RowSelectionState>({
		'1': true,
	});

	return (
		<div style={{ width: '600px', height: '200px', position: 'relative' }}>
			<SelectionBar
				selectedRows={selectedRows}
				setSelectedRows={(newSelection: RowSelectionState) => setSelectedRows(newSelection)}
				handleDelete={() => {
					args.handleDelete?.();
					setSelectedRows({});
				}}
			/>
		</div>
	);
};

// Single row selected
export const SingleRowSelected: Story = {
	render: (args) => <SingleRowSelectionBar {...args} />,
	args: {
		handleDelete: fn(),
	},
};

// Component for MultipleRowsSelected story
const MultipleRowsSelectionBar = (args: any) => {
	const [selectedRows, setSelectedRows] = useState<RowSelectionState>({
		'1': true,
		'2': true,
		'3': true,
		'4': true,
		'5': true,
	});

	return (
		<div style={{ width: '600px', height: '200px', position: 'relative' }}>
			<SelectionBar
				selectedRows={selectedRows}
				setSelectedRows={(newSelection: RowSelectionState) => setSelectedRows(newSelection)}
				handleDelete={() => {
					args.handleDelete?.();
					setSelectedRows({});
				}}
			/>
		</div>
	);
};

// Multiple rows selected
export const MultipleRowsSelected: Story = {
	render: (args) => <MultipleRowsSelectionBar {...args} />,
	args: {
		handleDelete: fn(),
	},
};
