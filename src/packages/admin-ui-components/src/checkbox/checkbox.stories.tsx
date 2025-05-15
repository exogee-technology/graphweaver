import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Checkbox } from './component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Components/Checkbox',
	component: Checkbox,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: 'centered',
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		checked: {
			control: 'boolean',
			description: 'Whether the checkbox is checked or not',
		},
		disabled: {
			control: 'boolean',
			description: 'Whether the checkbox is disabled',
		},
		indeterminate: {
			control: 'boolean',
			description: 'Whether the checkbox is in an indeterminate state',
		},
		onChange: {
			action: 'changed',
			description: 'Callback function triggered when the checkbox state changes',
		},
	},
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
				<Story />
				<span style={{ marginLeft: '10px' }}>Checkbox Label</span>
			</div>
		),
	],
} as Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Unchecked: Story = {
	args: {
		checked: false,
	},
};

export const Checked: Story = {
	args: {
		checked: true,
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

export const DisabledChecked: Story = {
	args: {
		disabled: true,
		checked: true,
	},
};

export const Indeterminate: Story = {
	args: {
		indeterminate: true,
	},
};

export const WithCustomLabel: Story = {
	args: {
		checked: false,
	},
	decorators: [
		(Story) => (
			<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
				<Story />
				<span style={{ marginLeft: '10px', fontWeight: 'bold', color: '#7038c2' }}>
					Custom styled label
				</span>
			</div>
		),
	],
};

export const InForm: Story = {
	args: {
		name: 'termsAccepted',
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
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
					<Story />
					<span style={{ marginLeft: '10px' }}>I accept the terms and conditions</span>
				</div>
				<button
					type="submit"
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
