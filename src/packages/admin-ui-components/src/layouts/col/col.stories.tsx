import type { Meta, StoryObj } from '@storybook/react-vite';
import { Col } from './component';
import { Grid } from '../grid';

const meta = {
	title: 'Layout/Col',
	component: Col,
	parameters: {
		layout: 'padded',
	},
} as Meta<typeof Col>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create demo wrapping grid to demonstrate Col in context
const DemoGrid = ({ children }: { children: React.ReactNode }) => (
	<Grid cols={12} gap={16}>
		{children}
	</Grid>
);

export const Default: Story = {
	render: (args) => (
		<DemoGrid>
			<Col {...args}>
				<div style={{ padding: '16px', backgroundColor: '#f0f0f0', height: '100%' }}>
					Column (span 1)
				</div>
			</Col>
		</DemoGrid>
	),
	args: {
		span: 1,
	},
};

export const SpanMultipleColumns: Story = {
	render: (args) => (
		<DemoGrid>
			<Col {...args}>
				<div style={{ padding: '16px', backgroundColor: '#e0e0e0', height: '100%' }}>
					Column (span 4)
				</div>
			</Col>
		</DemoGrid>
	),
	args: {
		span: 4,
	},
};

export const MultipleColumnsInGrid: Story = {
	render: () => (
		<DemoGrid>
			<Col span={3}>
				<div style={{ padding: '16px', backgroundColor: '#e6f7ff', height: '100%' }}>Span 3</div>
			</Col>
			<Col span={3}>
				<div style={{ padding: '16px', backgroundColor: '#d9f2ff', height: '100%' }}>Span 3</div>
			</Col>
			<Col span={6}>
				<div style={{ padding: '16px', backgroundColor: '#ccedff', height: '100%' }}>Span 6</div>
			</Col>
		</DemoGrid>
	),
};

export const FullWidthColumn: Story = {
	render: (args) => (
		<DemoGrid>
			<Col {...args}>
				<div style={{ padding: '16px', backgroundColor: '#e0e0e0', height: '100%' }}>
					Full width column (span 12)
				</div>
			</Col>
		</DemoGrid>
	),
	args: {
		span: 12,
	},
};
