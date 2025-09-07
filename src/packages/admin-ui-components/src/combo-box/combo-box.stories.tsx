import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComboBox, SelectMode, SelectOption, DataFetcher } from './component';

// Sample options for the stories
const fruitOptions: SelectOption[] = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'banana', label: 'Banana' },
	{ value: 'cherry', label: 'Cherry' },
	{ value: 'durian', label: 'Durian' },
	{ value: 'elderberry', label: 'Elderberry' },
	{ value: 'fig', label: 'Fig' },
	{ value: 'grape', label: 'Grape' },
	{ value: 'honeydew', label: 'Honeydew' },
];

const colorOptions: SelectOption[] = [
	{ value: 'red', label: 'Red' },
	{ value: 'green', label: 'Green' },
	{ value: 'blue', label: 'Blue' },
	{ value: 'yellow', label: 'Yellow' },
	{ value: 'purple', label: 'Purple' },
];

// Mock data fetcher for lazy loading demo
const mockDataFetcher: DataFetcher = async ({ page, searchTerm }) => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 500));

	// Generate mock data
	const allItems: SelectOption[] = Array.from({ length: 1000 }, (_, i) => ({
		value: `item-${i}`,
		label: `Item ${i + 1}${searchTerm ? ` (${searchTerm})` : ''}`,
	}));

	// Filter by search term if provided
	const filteredItems = searchTerm
		? allItems.filter((item) => item.label?.toLowerCase().includes(searchTerm.toLowerCase()))
		: allItems;

	const pageSize = 20;
	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	const data = filteredItems.slice(startIndex, endIndex);

	// Return just the data array - component will automatically fetch more if data.length > 0
	return data;
};

const meta = {
	title: 'Inputs/ComboBox',
	component: ComboBox,
	parameters: { layout: 'centered' },

	argTypes: {
		options: {
			description: 'The list of options available in the dropdown',
		},
		onChange: {
			action: 'onChange',
			description: 'Function called when a selection changes',
		},
		mode: {
			control: 'radio',
			options: Object.values(SelectMode),
			description: 'Determines if single or multiple selections are allowed',
		},
		value: {
			description: 'The currently selected option(s)',
		},
		placeholder: {
			control: 'text',
			description: 'Text to display when no option is selected',
		},
		loading: {
			control: 'boolean',
			description: 'Whether to show a loading spinner in the dropdown',
		},
		autoFocus: {
			control: 'boolean',
			description: 'Whether the combobox should be focused when mounted',
		},
		disabled: {
			control: 'boolean',
			description: 'Whether the combobox is disabled',
		},
		allowFreeTyping: {
			control: 'boolean',
			description: 'Whether users can type freely to filter options',
		},
		onInputChange: {
			action: 'onInputChange',
			description: 'Function called when the input value changes (when allowFreeTyping is true)',
		},
		onOpen: {
			action: 'onOpen',
			description: 'Function called when the dropdown menu opens',
		},
	},
} as Meta<typeof ComboBox>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const SingleSelect: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Select a fruit',
	},
};

export const MultiSelect: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.MULTI,
		placeholder: 'Select fruits',
	},
};

export const WithSelectedValue: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.SINGLE,
		value: fruitOptions[2], // Cherry
		placeholder: 'Select a fruit',
	},
};

export const WithMultipleSelectedValues: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.MULTI,
		value: [fruitOptions[0], fruitOptions[3]], // Apple and Durian
		placeholder: 'Select fruits',
	},
	parameters: {
		docs: {
			description: {
				story:
					"This ComboBox shows multiple selected items. When you open the dropdown, you'll see the selected items at the top with purple lozenges that can be clicked to deselect individual items.",
			},
		},
	},
};

export const SelectedItemsInDropdown: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.MULTI,
		value: [fruitOptions[0], fruitOptions[2], fruitOptions[4]], // Apple, Cherry, Elderberry
		placeholder: 'Select fruits',
	},
	parameters: {
		docs: {
			description: {
				story:
					'This ComboBox demonstrates the selected items feature. Selected items appear at the top of the dropdown as purple lozenges. Click on any lozenge to deselect that item, and it will return to the main options list in its original order.',
			},
		},
	},
};

export const Loading: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Loading options...',
		loading: true,
	},
};

export const Disabled: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'This combobox is disabled',
		disabled: true,
	},
};

export const WithFreeTyping: Story = {
	args: {
		options: fruitOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Type to filter options',
		allowFreeTyping: true,
	},
};

export const InForm: Story = {
	args: {
		options: colorOptions,
		mode: SelectMode.SINGLE,
		placeholder: 'Select color',
	},
	decorators: [
		(Story) => (
			<form
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '20px',
					padding: '20px',
					border: '1px solid #3b3349',
					borderRadius: '6px',
					width: '300px',
				}}
			>
				<div>
					<label
						style={{
							display: 'block',
							marginBottom: '8px',
							color: '#e0dde5',
							fontSize: '14px',
						}}
					>
						Favorite Color
					</label>
					<Story />
				</div>
				<button
					type="button"
					style={{
						padding: '6px 12px',
						backgroundColor: '#7038c2',
						color: 'white',
						border: 'none',
						borderRadius: '4px',
						cursor: 'pointer',
					}}
				>
					Submit
				</button>
			</form>
		),
	],
};

export const LazyLoadingWithInfiniteScroll: Story = {
	args: {
		mode: SelectMode.SINGLE,
		placeholder: 'Type to search and scroll to load more...',
		allowFreeTyping: true,
		dataFetcher: mockDataFetcher,
		searchDebounceMs: 300,
	},
	parameters: {
		docs: {
			description: {
				story:
					'This ComboBox demonstrates lazy loading with infinite scroll. It fetches data in pages as you scroll, and supports search with debouncing. The data fetcher simulates an API call with a 500ms delay.',
			},
		},
	},
};
