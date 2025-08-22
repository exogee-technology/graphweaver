import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from './component';
import { Col } from '../col';
import { Row } from '../row';

const meta = {
	title: 'Layout/Grid',
	component: Grid,
	parameters: {
		layout: 'padded',
	},
} as Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		cols: 12,
		gap: 16,
		children: (
			<>
				<Col span={4}>
					<div style={{ padding: '16px', backgroundColor: '#e0e0e0', height: '100px' }}>
						Column 1
					</div>
				</Col>
				<Col span={4}>
					<div style={{ padding: '16px', backgroundColor: '#d0d0d0', height: '100px' }}>
						Column 2
					</div>
				</Col>
				<Col span={4}>
					<div style={{ padding: '16px', backgroundColor: '#c0c0c0', height: '100px' }}>
						Column 3
					</div>
				</Col>
			</>
		),
	},
};

export const CustomColumns: Story = {
	args: {
		cols: 3,
		gap: 16,
		children: (
			<>
				<Col span={1}>
					<div style={{ padding: '16px', backgroundColor: '#e0e0e0', height: '100px' }}>1/3</div>
				</Col>
				<Col span={2}>
					<div style={{ padding: '16px', backgroundColor: '#d0d0d0', height: '100px' }}>2/3</div>
				</Col>
			</>
		),
	},
};

export const CustomGap: Story = {
	args: {
		cols: 12,
		gap: 32,
		children: (
			<>
				<Col span={3}>
					<div style={{ padding: '16px', backgroundColor: '#e0e0e0', height: '100px' }}>
						Column 1
					</div>
				</Col>
				<Col span={3}>
					<div style={{ padding: '16px', backgroundColor: '#d0d0d0', height: '100px' }}>
						Column 2
					</div>
				</Col>
				<Col span={3}>
					<div style={{ padding: '16px', backgroundColor: '#c0c0c0', height: '100px' }}>
						Column 3
					</div>
				</Col>
				<Col span={3}>
					<div style={{ padding: '16px', backgroundColor: '#b0b0b0', height: '100px' }}>
						Column 4
					</div>
				</Col>
			</>
		),
	},
};

export const WithRows: Story = {
	args: {
		cols: 2,
		gap: 16,
		maxRowsPerColumn: 3,
		children: (
			<>
				<Row>
					<div style={{ padding: '16px', backgroundColor: '#e6f7ff', width: '100%' }}>Row 1</div>
				</Row>
				<Row>
					<div style={{ padding: '16px', backgroundColor: '#d9f2ff', width: '100%' }}>Row 2</div>
				</Row>
				<Row>
					<div style={{ padding: '16px', backgroundColor: '#ccedff', width: '100%' }}>Row 3</div>
				</Row>
				<Row>
					<div style={{ padding: '16px', backgroundColor: '#bfebff', width: '100%' }}>Row 4</div>
				</Row>
				<Row>
					<div style={{ padding: '16px', backgroundColor: '#b3e6ff', width: '100%' }}>Row 5</div>
				</Row>
				<Row>
					<div style={{ padding: '16px', backgroundColor: '#a6e1ff', width: '100%' }}>Row 6</div>
				</Row>
			</>
		),
	},
};
