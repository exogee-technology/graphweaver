import type { Meta, StoryObj } from '@storybook/react';
import { StarField } from './component';

const meta = {
	title: 'Layout/StarField',
	component: StarField,
	parameters: {
		layout: 'fullscreen',
	},
} as Meta<typeof StarField>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default StarField
export const Default: Story = {
	render: () => (
		<div style={{ width: '100%', height: '500px' }}>
			<StarField />
		</div>
	),
};

// StarField with content overlay
export const WithContent: Story = {
	render: () => (
		<div style={{ width: '100%', height: '500px' }}>
			<StarField>
				<div
					style={{
						position: 'absolute',
						top: '50%',
						left: '50%',
						transform: 'translate(-50%, -50%)',
						textAlign: 'center',
						color: 'white',
						zIndex: 10,
					}}
				>
					<h1
						style={{
							fontSize: '3rem',
							marginBottom: '1rem',
							background: 'linear-gradient(to right, #7C5DC7, #FFFFFF)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
						}}
					>
						Graphweaver
					</h1>
					<p style={{ fontSize: '1.5rem', maxWidth: '500px' }}>
						A beautiful animated star field background for your application
					</p>
				</div>
			</StarField>
		</div>
	),
};

// Small container version
export const SmallContainer: Story = {
	render: () => (
		<div
			style={{
				width: '300px',
				height: '300px',
				margin: '0 auto',
				borderRadius: '8px',
				overflow: 'hidden',
			}}
		>
			<StarField />
		</div>
	),
};

// Card with StarField background
export const CardBackground: Story = {
	render: () => (
		<div
			style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				padding: '2rem',
				minHeight: '500px',
			}}
		>
			<div
				style={{
					width: '400px',
					height: '300px',
					borderRadius: '12px',
					overflow: 'hidden',
					boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
					position: 'relative',
				}}
			>
				<StarField />
				<div
					style={{
						position: 'absolute',
						bottom: '20px',
						left: '20px',
						right: '20px',
						background: 'rgba(16, 10, 28, 0.7)',
						backdropFilter: 'blur(5px)',
						padding: '20px',
						borderRadius: '8px',
						color: 'white',
					}}
				>
					<h3 style={{ margin: '0 0 10px 0' }}>Featured Content</h3>
					<p style={{ margin: '0', fontSize: '0.9rem', opacity: '0.8' }}>
						The star field provides a beautiful animated background for cards and UI elements.
					</p>
				</div>
			</div>
		</div>
	),
};
