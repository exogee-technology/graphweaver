import type { Meta, StoryObj } from '@storybook/react';

import { Alert } from './alert';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Components/Alert',
	component: Alert,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: 'centered',
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		severity: {
			control: 'select',
			options: ['error', 'warning', 'info', 'success'],
			description: 'The severity level of the alert',
		},
		children: {
			control: 'text',
			description: 'The content of the alert',
		},
	},
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Error: Story = {
	args: {
		severity: 'error',
		children: 'This is an error alert. Something went wrong!',
	},
};

export const Warning: Story = {
	args: {
		severity: 'warning',
		children: 'This is a warning alert. Proceed with caution!',
	},
};

export const Info: Story = {
	args: {
		severity: 'info',
		children: 'This is an info alert. Here is some information.',
	},
};

export const Success: Story = {
	args: {
		severity: 'success',
		children: 'This is a success alert. Operation completed successfully!',
	},
};
