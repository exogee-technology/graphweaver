import { Meta, StoryObj } from '@storybook/react';
import { DetailPanelFieldLabel } from './component';

const meta = {
	title: 'Components/DetailPanelFieldLabel',
	component: DetailPanelFieldLabel,
	parameters: {
		docs: {
			description: {
				component:
					'A label component for form fields in the detail panel, with support for required field indication.',
			},
		},
	},
	argTypes: {
		fieldName: {
			control: 'text',
			description: 'The name of the field to display as label text',
		},
		required: {
			control: 'boolean',
			description: 'Whether to show the required field indicator (*)',
		},
	},
} as Meta<typeof DetailPanelFieldLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

// Regular field label
export const Regular: Story = {
	args: {
		fieldName: 'Field Name',
		required: false,
	},
};

// Required field label
export const Required: Story = {
	args: {
		fieldName: 'Required Field',
		required: true,
	},
};

// Example with long field name
export const LongFieldName: Story = {
	args: {
		fieldName: 'This is a very long field name that might wrap to multiple lines',
		required: false,
	},
};
