import type { Meta, StoryObj } from '@storybook/react';
import { DefaultLayout } from './component';

// Need to mock dependencies since DefaultLayout relies on SideBar and other components
// In a real storybook implementation, you'd properly set up these components
// For this example we're creating a simplified version
const MockDefaultLayout = ({ children }: { children: React.ReactNode }) => (
	<div
		style={{
			display: 'flex',
			minHeight: '100vh',
		}}
	>
		<div
			style={{
				width: '320px',
				backgroundColor: '#222',
				color: '#fff',
				padding: '20px',
				boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
			}}
		>
			<div style={{ fontSize: '16px', fontWeight: 'bold', padding: '16px 0' }}>
				Graphweaver Admin
			</div>
			<div style={{ marginTop: '20px' }}>
				<div style={{ padding: '10px 0', borderBottom: '1px solid #444' }}>Dashboard</div>
				<div style={{ padding: '10px 0', borderBottom: '1px solid #444' }}>Users</div>
				<div style={{ padding: '10px 0', borderBottom: '1px solid #444' }}>Products</div>
				<div style={{ padding: '10px 0', borderBottom: '1px solid #444' }}>Orders</div>
				<div style={{ padding: '10px 0', borderBottom: '1px solid #444' }}>Settings</div>
			</div>
		</div>
		<div
			style={{
				flex: 1,
				padding: '24px',
				backgroundColor: '#f5f5f5',
			}}
		>
			{children}
		</div>
	</div>
);

const meta = {
	title: 'Layout/DefaultLayout',
	component: MockDefaultLayout,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component:
					'Note: This is a simplified mock of the DefaultLayout for documentation purposes. The actual component integrates with SideBar and other components.',
			},
		},
	},
} as Meta<typeof MockDefaultLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		children: (
			<div>
				<h1 style={{ marginTop: 0, marginBottom: '24px' }}>Content Area</h1>
				<p>
					This is the main content area of the DefaultLayout component. In a real application, this
					would contain the main page content.
				</p>
			</div>
		),
	},
};

export const WithComplexContent: Story = {
	args: {
		children: (
			<div>
				<h1 style={{ marginTop: 0, marginBottom: '24px' }}>Dashboard</h1>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: '16px',
						marginBottom: '24px',
					}}
				>
					<div
						style={{
							backgroundColor: '#fff',
							borderRadius: '4px',
							padding: '16px',
							boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
						}}
					>
						<h3>Total Users</h3>
						<p style={{ fontSize: '24px', fontWeight: 'bold' }}>1,245</p>
					</div>
					<div
						style={{
							backgroundColor: '#fff',
							borderRadius: '4px',
							padding: '16px',
							boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
						}}
					>
						<h3>Active Orders</h3>
						<p style={{ fontSize: '24px', fontWeight: 'bold' }}>37</p>
					</div>
					<div
						style={{
							backgroundColor: '#fff',
							borderRadius: '4px',
							padding: '16px',
							boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
						}}
					>
						<h3>Monthly Revenue</h3>
						<p style={{ fontSize: '24px', fontWeight: 'bold' }}>$12,450</p>
					</div>
				</div>
				<div
					style={{
						backgroundColor: '#fff',
						borderRadius: '4px',
						padding: '16px',
						boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
					}}
				>
					<h2>Recent Activity</h2>
					<div style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
						New user registered: John Smith
					</div>
					<div style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
						Order #1234 completed
					</div>
					<div style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
						Product inventory updated
					</div>
					<div style={{ padding: '12px 0' }}>System maintenance scheduled</div>
				</div>
			</div>
		),
	},
};
