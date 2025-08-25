import type { Meta, StoryObj } from '@storybook/react-vite';

// Import from Storybook testing library
import { fn } from 'storybook/test';

// Create a mock component for the SideBar that doesn't depend on virtual modules
// This is a simplified version to demonstrate the component in Storybook
const MockSideBar = () => {
	// Simplified UI structure based on the real component
	return (
		<div
			className="mock-sidebar"
			style={{
				height: '100%',
				background: 'hsl(264, 40%, 10%)',
				borderRight: '1px solid rgba(255, 255, 255, 0.1)',
				display: 'flex',
				flexDirection: 'column',
				color: 'white',
				padding: '20px 0',
				fontFamily: 'sans-serif',
			}}
		>
			{/* Logo */}
			<div
				style={{
					marginLeft: '24px',
					marginBottom: '32px',
				}}
			>
				<svg
					width="52"
					height="26"
					viewBox="0 0 168 84"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M86.5 0L173 84H0L86.5 0Z" fill="#7C5DC7" />
				</svg>
			</div>

			{/* Sidebar Content */}
			<div style={{ padding: '0 8px', overflowY: 'auto' }}>
				{/* Dashboards Section */}
				<p style={{ opacity: 0.6, marginLeft: '16px', fontSize: '14px' }}>Dashboards</p>
				<ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
					<li style={{ padding: '4px 8px' }}>
						<a
							href="#"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '6px 10px',
								borderRadius: '6px',
								textDecoration: 'none',
								color: 'white',
							}}
						>
							<span>📊</span>
							<span>Dashboard</span>
						</a>
					</li>
					<li style={{ padding: '4px 8px' }}>
						<a
							href="#"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '6px 10px',
								borderRadius: '6px',
								textDecoration: 'none',
								color: 'white',
							}}
						>
							<span>📈</span>
							<span>Analytics</span>
						</a>
					</li>
				</ul>

				{/* Data Sources Section */}
				<p style={{ opacity: 0.6, marginLeft: '16px', fontSize: '14px' }}>Data Sources</p>

				{/* Database 1 */}
				<ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
					<li
						style={{
							padding: '8px',
							backgroundColor: '#382f46',
							borderRadius: '6px',
						}}
					>
						<a
							href="#"
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '6px 10px',
								textDecoration: 'none',
								color: 'white',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<span>💾</span>
								<span>Database 1</span>
							</div>
							<span>▼</span>
						</a>
						<ul style={{ listStyle: 'none', padding: '0 0 0 16px', margin: '8px 0' }}>
							<li>
								<a
									href="#"
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '6px 10px',
										borderRadius: '6px',
										textDecoration: 'none',
										color: 'white',
										opacity: 0.6,
									}}
								>
									<span>📋</span>
									<span>Users</span>
								</a>
							</li>
							<li>
								<a
									href="#"
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '6px 10px',
										borderRadius: '6px',
										textDecoration: 'none',
										color: 'white',
										opacity: 0.6,
									}}
								>
									<span>📋</span>
									<span>Products</span>
								</a>
							</li>
							<li>
								<a
									href="#"
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '8px',
										padding: '6px 10px',
										borderRadius: '6px',
										textDecoration: 'none',
										color: 'white',
										opacity: 0.6,
									}}
								>
									<span>📋</span>
									<span>Orders</span>
								</a>
							</li>
						</ul>
					</li>
				</ul>

				{/* Database 2 */}
				<ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
					<li style={{ padding: '8px' }}>
						<a
							href="#"
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								padding: '6px 10px',
								textDecoration: 'none',
								color: 'white',
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
								<span>💾</span>
								<span>Database 2</span>
							</div>
							<span>▲</span>
						</a>
					</li>
				</ul>

				{/* Analytics Section */}
				<p style={{ opacity: 0.6, marginLeft: '16px', fontSize: '14px' }}>Analytics</p>
				<ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
					<li style={{ padding: '4px 8px' }}>
						<a
							href="#"
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '8px',
								padding: '6px 10px',
								borderRadius: '6px',
								textDecoration: 'none',
								color: 'white',
							}}
						>
							<span>🔍</span>
							<span>Trace</span>
						</a>
					</li>
				</ul>
			</div>

			{/* Footer */}
			<div style={{ marginTop: 'auto', textAlign: 'center', padding: '16px', opacity: 0.6 }}>
				<p>Powered by Graphweaver</p>
			</div>
		</div>
	);
};

// Container component for consistent styling
const SideBarContainer = ({ children }: { children: React.ReactNode }) => (
	<div style={{ height: '600px', width: '250px', border: '1px solid #ccc' }}>{children}</div>
);

const meta = {
	title: 'Display/SideBar',
	component: MockSideBar,
	decorators: [(Story) => <SideBarContainer>{Story()}</SideBarContainer>],
	parameters: {
		layout: 'centered',
	},
} as Meta<typeof MockSideBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story showing the sidebar with data
export const Default: Story = {};

// Authenticated view showing sign out button
export const Authenticated: Story = {
	render: () => {
		return (
			<div
				className="mock-sidebar"
				style={{
					height: '100%',
					background: 'hsl(264, 40%, 10%)',
					borderRight: '1px solid rgba(255, 255, 255, 0.1)',
					display: 'flex',
					flexDirection: 'column',
					color: 'white',
					padding: '20px 0',
					fontFamily: 'sans-serif',
				}}
			>
				{/* Content same as Default but with sign out button */}
				<div
					style={{
						marginLeft: '24px',
						marginBottom: '32px',
					}}
				>
					<svg
						width="52"
						height="26"
						viewBox="0 0 168 84"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path d="M86.5 0L173 84H0L86.5 0Z" fill="#7C5DC7" />
					</svg>
				</div>

				{/* Simplified content */}
				<div style={{ padding: '0 8px', flexGrow: 1 }}>
					<p style={{ opacity: 0.6, marginLeft: '16px', fontSize: '14px' }}>Data Sources</p>
					{/* Simplified database list */}
				</div>

				{/* Sign Out button */}
				<div
					style={{
						marginTop: 'auto',
						textAlign: 'center',
						padding: '16px',
					}}
				>
					<button
						style={{
							background: 'rgba(255, 255, 255, 0.1)',
							border: '1px solid rgba(255, 255, 255, 0.2)',
							borderRadius: '4px',
							color: 'white',
							padding: '8px 16px',
							cursor: 'pointer',
						}}
						onClick={fn()}
					>
						Sign Out
					</button>
				</div>
			</div>
		);
	},
};
