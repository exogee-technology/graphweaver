import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Loader } from './component';

const meta = {
	title: 'Components/Loader',
	component: Loader,
	parameters: {
		docs: {
			description: {
				component: 'A loading indicator component with an animated gradient blob effect.',
			},
		},
	},
	decorators: [
		(Story) => (
			<div style={{ height: '300px', position: 'relative', backgroundColor: '#14111a' }}>
				<Story />
			</div>
		),
	],
} as Meta<typeof Loader>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default loader
export const Default: Story = {};

// Loader in a smaller container
export const InSmallContainer = () => (
	<div
		style={{
			height: '150px',
			width: '150px',
			position: 'relative',
			border: '1px solid #333',
			borderRadius: '8px',
		}}
	>
		<Loader />
	</div>
);

// Loader in a larger container
export const InLargeContainer = () => (
	<div
		style={{
			height: '500px',
			width: '100%',
			position: 'relative',
			border: '1px solid #333',
			borderRadius: '8px',
		}}
	>
		<Loader />
	</div>
);

// Example showing loader in a typical loading state context
export const LoadingPage = () => (
	<div
		style={{
			height: '500px',
			position: 'relative',
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#14111a',
			color: 'white',
			padding: '20px',
		}}
	>
		<div style={{ textAlign: 'center', marginBottom: '40px' }}>
			<h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Loading Data</h1>
			<p style={{ fontSize: '14px', opacity: 0.7 }}>
				Please wait while we fetch your information...
			</p>
		</div>

		<div style={{ height: '300px', width: '100%', position: 'relative' }}>
			<Loader />
		</div>
	</div>
);

// Example showing multiple loaders
export const MultipleLoaders = () => (
	<div
		style={{
			display: 'flex',
			flexWrap: 'wrap',
			gap: '20px',
			justifyContent: 'center',
		}}
	>
		{[...Array(3)].map((_, index) => (
			<div
				key={index}
				style={{
					height: '200px',
					width: '200px',
					position: 'relative',
					border: '1px solid #333',
					borderRadius: '8px',
					backgroundColor: index === 0 ? '#14111a' : index === 1 ? '#1a1424' : '#242414',
				}}
			>
				<Loader />
			</div>
		))}
	</div>
);
