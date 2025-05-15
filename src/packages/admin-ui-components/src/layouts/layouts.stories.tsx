import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from './grid';
import { Row } from './row';
import { Col } from './col';

// Define a mock component to serve as a documentation entry point
// This component is not meant to be used directly, but as a demonstration
// of how the layout components work together
const LayoutsDemo = () => (
	<div>
		<h2>Graphweaver Layout System</h2>
		<p>
			These layout components provide a flexible system for building complex UI layouts. They are
			designed to work together to create responsive, well-structured interfaces.
		</p>
		<Grid cols={12} gap={16}>
			<Col span={12}>
				<div
					style={{
						padding: '16px',
						backgroundColor: '#f0f0f0',
						borderRadius: '4px',
						marginBottom: '16px',
					}}
				>
					<h3>Grid Component</h3>
					<p>Creates a CSS grid layout with configurable columns and gaps.</p>
				</div>
			</Col>
			<Col span={6}>
				<div
					style={{
						padding: '16px',
						backgroundColor: '#e0e0e0',
						borderRadius: '4px',
						height: '100%',
					}}
				>
					<h3>Col Component</h3>
					<p>Defines a column that spans a specified number of grid spaces.</p>
				</div>
			</Col>
			<Col span={6}>
				<div
					style={{
						padding: '16px',
						backgroundColor: '#d0d0d0',
						borderRadius: '4px',
						height: '100%',
					}}
				>
					<h3>Row Component</h3>
					<p>Creates a horizontal flex layout for arranging elements in a row.</p>
				</div>
			</Col>
			<Col span={12}>
				<div
					style={{
						padding: '16px',
						backgroundColor: '#c0c0c0',
						borderRadius: '4px',
						marginTop: '16px',
					}}
				>
					<h3>Page Component</h3>
					<p>
						Provides a standardized layout for admin pages with consistent header and content areas.
					</p>
				</div>
			</Col>
			<Col span={12}>
				<div
					style={{
						padding: '16px',
						backgroundColor: '#b0b0b0',
						borderRadius: '4px',
						marginTop: '16px',
					}}
				>
					<h3>DefaultLayout Component</h3>
					<p>The main application shell with a resizable sidebar and content area.</p>
				</div>
			</Col>
		</Grid>
	</div>
);

const meta = {
	title: 'Layout/Overview',
	component: LayoutsDemo,
	parameters: {
		layout: 'padded',
		docs: {
			description: {
				component: 'An overview of the layout components available in the Graphweaver Admin UI.',
			},
		},
	},
} as Meta<typeof LayoutsDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
