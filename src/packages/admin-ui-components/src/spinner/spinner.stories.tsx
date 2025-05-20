import type { Meta, StoryObj } from '@storybook/react';
import { Spinner, SpinnerSize } from './component';

const meta = {
	title: 'Display/Spinner',
	component: Spinner,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		size: {
			control: 'select',
			options: [SpinnerSize.LARGE, SpinnerSize.SMALL],
		},
	},
} as Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Container to better visualize the spinner
const Container = ({
	children,
	background = false,
}: {
	children: React.ReactNode;
	background?: boolean;
}) => (
	<div
		style={{
			padding: '40px',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			background: background ? '#271f36' : 'transparent',
			width: '100%',
			height: '100%',
		}}
	>
		{children}
	</div>
);

// Large spinner (default)
export const Large: Story = {
	render: (args) => (
		<Container background>
			<Spinner {...args} />
		</Container>
	),
	args: {
		size: SpinnerSize.LARGE,
	},
};

// Small spinner
export const Small: Story = {
	render: (args) => (
		<Container background>
			<Spinner {...args} />
		</Container>
	),
	args: {
		size: SpinnerSize.SMALL,
	},
};

// Spinner in a constrained container
export const InContainer: Story = {
	render: (args) => (
		<div
			style={{
				border: '1px dashed #7C5DC7',
				borderRadius: '8px',
				width: '200px',
				height: '150px',
				background: '#271f36',
			}}
		>
			<Spinner {...args} />
		</div>
	),
	args: {
		size: SpinnerSize.LARGE,
	},
};

// Multiple spinners showing both sizes
export const MultipleSizes: Story = {
	render: () => (
		<Container background>
			<div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
				<div>
					<Spinner size={SpinnerSize.LARGE} />
					<p style={{ textAlign: 'center', marginTop: '10px', color: 'white' }}>Large</p>
				</div>
				<div>
					<Spinner size={SpinnerSize.SMALL} />
					<p style={{ textAlign: 'center', marginTop: '10px', color: 'white' }}>Small</p>
				</div>
			</div>
		</Container>
	),
};
