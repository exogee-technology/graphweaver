import type { Meta, StoryObj } from '@storybook/react';
import { Spacer } from './component';

const meta = {
	title: 'Layout/Spacer',
	component: Spacer,
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		height: { control: 'number' },
		width: { control: 'number' },
		grow: { control: 'number' },
		shrink: { control: 'number' },
		flex: { control: 'number' },
		className: { control: 'text' },
	},
} as Meta<typeof Spacer>;

export default meta;
type Story = StoryObj<typeof meta>;

// A container to better visualize the spacer
const Container = ({
	children,
	style,
}: {
	children: React.ReactNode;
	style?: React.CSSProperties;
}) => (
	<div
		style={{
			border: '1px dashed #7C5DC7',
			padding: '10px',
			backgroundColor: 'rgba(124, 93, 199, 0.1)',
			display: 'flex',
			...style,
		}}
	>
		{children}
	</div>
);

const Box = ({ children }: { children?: React.ReactNode }) => (
	<div
		style={{
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			backgroundColor: '#7C5DC7',
			color: 'white',
			width: '50px',
			height: '50px',
			borderRadius: '4px',
		}}
	>
		{children || 'Box'}
	</div>
);

// Basic spacer with fixed height
export const HeightSpacer: Story = {
	render: (args) => (
		<Container style={{ flexDirection: 'column', alignItems: 'flex-start', width: '200px' }}>
			<Box>1</Box>
			<Spacer {...args} />
			<Box>2</Box>
		</Container>
	),
	args: {
		height: 20,
	},
};

// Basic spacer with fixed width
export const WidthSpacer: Story = {
	render: (args) => (
		<Container style={{ flexDirection: 'row', alignItems: 'center', height: '100px' }}>
			<Box>1</Box>
			<Spacer {...args} />
			<Box>2</Box>
		</Container>
	),
	args: {
		width: 50,
	},
};

// Grow spacer to push elements apart
export const GrowSpacer: Story = {
	render: (args) => (
		<Container style={{ width: '400px' }}>
			<Box>Left</Box>
			<Spacer {...args} />
			<Box>Right</Box>
		</Container>
	),
	args: {
		grow: 1,
	},
};

// Flex spacer distributing multiple items
export const FlexDistribution: Story = {
	render: (args) => (
		<Container style={{ width: '400px' }}>
			<Box>1</Box>
			<Spacer {...args} />
			<Box>2</Box>
			<Spacer {...args} />
			<Box>3</Box>
		</Container>
	),
	args: {
		flex: 1,
	},
};

// Combined height and width
export const FixedDimensions: Story = {
	render: (args) => (
		<Container style={{ flexDirection: 'column', alignItems: 'flex-start', width: '300px' }}>
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<Box>1</Box>
				<Spacer {...args} />
				<Box>2</Box>
			</div>
			<Spacer height={20} />
			<div style={{ display: 'flex', alignItems: 'center' }}>
				<Box>3</Box>
				<Spacer {...args} />
				<Box>4</Box>
			</div>
		</Container>
	),
	args: {
		width: 30,
		height: 0, // Setting height to 0 to make it clear that width is being used horizontally
	},
};
