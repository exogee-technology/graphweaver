import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { DefaultErrorFallback } from './component';

// Sample error types for stories
const sampleErrors = {
	basic: new Error('This is a basic error message'),
	withDetails: Object.assign(new Error('Error with stack trace and details'), {
		name: 'CustomError',
		stack: `Error: Error with stack trace and details
    at Object.<anonymous> (/src/example.js:1:1)
    at Module._compile (internal/modules/cjs/loader.js:1138:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1158:10)
    at Module.load (internal/modules/cjs/loader.js:986:32)
    at Function.Module._load (internal/modules/cjs/loader.js:879:14)`,
		code: 'ERR_CUSTOM',
		details: { failed: true, reason: 'Something went wrong' },
	}),
	network: Object.assign(new Error('Failed to fetch data: Network Error'), {
		name: 'NetworkError',
		status: 503,
		statusText: 'Service Unavailable',
	}),
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Components/DefaultErrorFallback',
	component: DefaultErrorFallback,
	parameters: {
		// Disabling the default layout since this component is full-page
		layout: 'fullscreen',
		// Opt out of automatic generation of docs
		docs: {
			autodocs: false,
		},
		// Set a dark background to match the component's design
		backgrounds: {
			default: 'dark',
		},
	},
	// Define argTypes for error object
	argTypes: {
		error: {
			description: 'The error object that triggered the fallback',
			control: {
				type: 'select',
				options: ['basic', 'withDetails', 'network'],
			},
		},
		resetErrorBoundary: {
			action: 'resetErrorBoundary',
			description: 'Function to reset the error boundary',
		},
	},
	// Default args for all stories
	args: {
		resetErrorBoundary: () => console.log('resetErrorBoundary called'),
	},
	// Decorators to provide CSS variables required by the component
	decorators: [
		(Story) => (
			<div
				style={
					{
						'--detail-border-color': '#3b3349',
						'--body-copy-color': '#e0dde5',
						height: '100vh',
						position: 'relative',
						overflow: 'hidden',
					} as React.CSSProperties
				}
			>
				<Story />
			</div>
		),
	],
} as Meta<typeof DefaultErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Error Story
export const BasicError: Story = {
	args: {
		error: sampleErrors.basic,
	},
};

// Detailed Error Story
export const DetailedError: Story = {
	args: {
		error: sampleErrors.withDetails,
	},
};

// Network Error Story
export const NetworkError: Story = {
	args: {
		error: sampleErrors.network,
	},
};
