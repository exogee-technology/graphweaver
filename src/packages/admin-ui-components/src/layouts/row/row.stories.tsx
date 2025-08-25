import type { Meta, StoryObj } from '@storybook/react-vite';
import { Row } from './component';

const meta = {
	title: 'Layout/Row',
	component: Row,
	parameters: {
		layout: 'padded',
	},
} as Meta<typeof Row>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (
			<div style={{ padding: '16px', backgroundColor: '#f0f0f0', width: '100%' }}>Row content</div>
		),
		gap: 16,
	},
};

export const WithMultipleChildren: Story = {
	args: {
		children: (
			<>
				<div style={{ padding: '16px', backgroundColor: '#e0e0e0', flex: 1 }}>Item 1</div>
				<div style={{ padding: '16px', backgroundColor: '#d0d0d0', flex: 1 }}>Item 2</div>
				<div style={{ padding: '16px', backgroundColor: '#c0c0c0', flex: 1 }}>Item 3</div>
			</>
		),
		gap: 16,
	},
};

export const CustomGap: Story = {
	args: {
		children: (
			<>
				<div style={{ padding: '16px', backgroundColor: '#e0e0e0', flex: 1 }}>Item 1</div>
				<div style={{ padding: '16px', backgroundColor: '#d0d0d0', flex: 1 }}>Item 2</div>
				<div style={{ padding: '16px', backgroundColor: '#c0c0c0', flex: 1 }}>Item 3</div>
			</>
		),
		gap: 32,
	},
};

export const WithCustomClassName: Story = {
	args: {
		children: (
			<div style={{ padding: '16px', backgroundColor: '#f0f0f0', width: '100%' }}>
				Row with custom class
			</div>
		),
		gap: 16,
		className: 'custom-row-class',
	},
};
