import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { ComboBox, SelectMode, SelectOption } from './component';

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

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Inputs/ComboBox',
	component: ComboBox,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: 'centered',
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
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
