import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DatePicker } from './component';
import { AdminUIFilterType } from '../utils';
import { DateTime } from 'luxon';

// Helper to handle the default value
const today = DateTime.now();
const tomorrow = today.plus({ days: 1 });

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Inputs/DatePicker',
	component: DatePicker,
	parameters: {
		layout: 'centered',
		docs: {
			// Opt out of automatic generation of docs for this component
			autodocs: false,
		},
	},
	// Hardcoded onChange function to prevent runtime errors
	args: {
		onChange: (startDate?: DateTime, endDate?: DateTime) => {
			console.log('Date changed:', startDate?.toISO(), endDate?.toISO());
		},
		filterType: AdminUIFilterType.DATE_RANGE,
		fieldType: 'Date',
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	argTypes: {
		onChange: {
			action: 'onChange',
			description: 'Function called when date selection changes',
		},
		placeholder: {
			control: 'text',
			description: 'Text to display when no date is selected',
		},
		isRangePicker: {
			control: 'boolean',
			description: 'Whether to enable date range selection',
		},
		startDate: {
			control: 'text',
			description: 'Initial start date as ISO string',
		},
		endDate: {
			control: 'text',
			description: 'Initial end date as ISO string (for range picker)',
		},
		locale: {
			control: 'text',
			description: 'Optional locale override for date formatting',
		},
		filterType: {
			control: 'radio',
			options: [AdminUIFilterType.DATE_RANGE, AdminUIFilterType.DATE_TIME_RANGE],
			description: 'Type of filter to use (determines if time input is shown)',
		},
		fieldType: {
			control: 'text',
			description: 'Type of field being filtered',
		},
	},
} as Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleDatePicker: Story = {
	args: {
		placeholder: 'Select date',
		isRangePicker: false,
	},
};

export const SingleDatePickerWithTime: Story = {
	args: {
		placeholder: 'Select date and time',
		isRangePicker: false,
		filterType: AdminUIFilterType.DATE_TIME_RANGE,
		fieldType: 'ISOString',
	},
};

export const DateRangePicker: Story = {
	args: {
		placeholder: 'Select date range',
		isRangePicker: true,
	},
};

export const DateTimeRangePicker: Story = {
	args: {
		placeholder: 'Select date and time range',
		isRangePicker: true,
		filterType: AdminUIFilterType.DATE_TIME_RANGE,
		fieldType: 'ISOString',
	},
};

export const WithPreselectedDate: Story = {
	args: {
		placeholder: 'Date is preselected',
		isRangePicker: false,
		startDate: today.toISO(),
	},
};

export const WithPreselectedRange: Story = {
	args: {
		placeholder: 'Date range is preselected',
		isRangePicker: true,
		startDate: today.toISO(),
		endDate: tomorrow.toISO(),
	},
};

export const WithCustomLocale: Story = {
	args: {
		placeholder: 'Using fr-FR locale',
		isRangePicker: false,
		locale: 'fr-FR',
	},
};

export const InFormContext: Story = {
	args: {
		placeholder: 'Select date',
		isRangePicker: false,
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
						Delivery Date
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
