import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { Select, SelectMode, SelectOption } from './component';

// Sample options for our stories
const sampleOptions: SelectOption[] = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' },
	{ value: 'orange', label: 'Orange' },
	{ value: 'grape', label: 'Grape' },
	{ value: 'kiwi', label: 'Kiwi' },
	{ value: 'mango', label: 'Mango' },
	{ value: 'pineapple', label: 'Pineapple' },
];

// Empty state options for demonstration
const emptyOptions: SelectOption[] = [];

const meta = {
	title: 'Components/Select',
	component: Select,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		options: { control: 'object' },
		mode: {
			control: 'select',
			options: [SelectMode.SINGLE, SelectMode.MULTI],
		},
		placeholder: { control: 'text' },
		loading: { control: 'boolean' },
		disabled: { control: 'boolean' },
		label: { control: 'text' },
		required: { control: 'boolean' },
		autoFocus: { control: 'boolean' },
	},
	args: {
		onChange: fn(),
		onOpen: fn(),
	},
} as Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic single select
export const SingleSelect: Story = {
	args: {
		options: sampleOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Select a fruit',
		label: 'Fruit',
	},
};

// Pre-selected value in single mode
export const SingleWithValue: Story = {
	args: {
		options: sampleOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Select a fruit',
		value: sampleOptions[2], // Orange
		label: 'Fruit',
	},
};

// Multiple select
export const MultiSelect: Story = {
	args: {
		options: sampleOptions,
		mode: SelectMode.MULTI,
		placeholder: 'Select fruits',
		label: 'Fruits',
	},
};

// Multiple select with pre-selected values
export const MultiWithValues: Story = {
	args: {
		options: sampleOptions,
		mode: SelectMode.MULTI,
		placeholder: 'Select fruits',
		value: [sampleOptions[0], sampleOptions[3]], // Apple and Grape
		label: 'Fruits',
	},
};

// Loading state
export const Loading: Story = {
	args: {
		options: sampleOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Loading options...',
		loading: true,
		label: 'Fruit',
	},
};

// Disabled state
export const Disabled: Story = {
	args: {
		options: sampleOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Cannot select',
		disabled: true,
		label: 'Fruit',
	},
};

// Empty options
export const NoOptions: Story = {
	args: {
		options: emptyOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'No fruits available',
		label: 'Fruit',
	},
};

// Required field
export const Required: Story = {
	args: {
		options: sampleOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Required field',
		required: true,
		label: 'Fruit',
	},
};
