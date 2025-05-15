import type { Meta, StoryObj } from '@storybook/react';
import { ToolBar } from './component';
import { fn } from '@storybook/test';

// Define types for the mock component
interface MockToolbarProps {
	title: string;
	subtitle: string;
	onExportToCSV?: () => void;
	showFilters?: boolean;
}

// Create a mock component for the Toolbar to avoid dependency issues
const MockToolbar = ({ title, subtitle, onExportToCSV, showFilters = true }: MockToolbarProps) => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				width: '100%',
				gap: '20px',
			}}
		>
			{/* Mock TitleBar */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-end',
					width: '100%',
				}}
			>
				<div>
					<h1 style={{ margin: '0 0 4px 0', fontSize: '28px', color: '#e0dde5' }}>{title}</h1>
					<p style={{ margin: 0, fontSize: '14px', color: 'rgba(224, 221, 229, 0.7)' }}>
						{subtitle}
					</p>
				</div>

				<div style={{ display: 'flex', gap: '12px' }}>
					<button
						style={{
							padding: '8px 16px',
							background: '#271f36',
							color: '#e0dde5',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '6px',
							cursor: 'pointer',
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
						}}
					>
						Open Playground
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M9 2H14V7"
								stroke="#e0dde5"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M14 2L7 9"
								stroke="#e0dde5"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
							<path
								d="M7 3H3.5C2.67157 3 2 3.67157 2 4.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V9"
								stroke="#e0dde5"
								strokeWidth="1.5"
								strokeLinecap="round"
							/>
						</svg>
					</button>

					{onExportToCSV && (
						<button
							onClick={onExportToCSV}
							style={{
								padding: '8px 16px',
								background: '#271f36',
								color: '#e0dde5',
								border: '1px solid rgba(255, 255, 255, 0.1)',
								borderRadius: '6px',
								cursor: 'pointer',
							}}
						>
							Export to CSV
						</button>
					)}

					<button
						style={{
							padding: '8px 16px',
							background: '#7C5DC7',
							color: '#e0dde5',
							border: 'none',
							borderRadius: '6px',
							cursor: 'pointer',
						}}
					>
						Create New Entity
					</button>
				</div>
			</div>

			{/* Mock FilterBar */}
			{showFilters && (
				<div
					style={{
						display: 'flex',
						flexDirection: 'row',
						alignItems: 'center',
						flexWrap: 'wrap',
						gap: '10px',
						padding: '10px 0',
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '5px',
							padding: '5px 10px',
							background: 'rgba(124, 93, 199, 0.1)',
							borderRadius: '4px',
						}}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 16 16"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M14.5 2H1.5L6.5 7.79V12.5L9.5 14V7.79L14.5 2Z"
								stroke="#e0dde5"
								strokeWidth="1.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							/>
						</svg>
					</div>

					{/* Mock filter components */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '5px',
							padding: '5px 10px',
							background: '#271f36',
							borderRadius: '4px',
							fontSize: '14px',
							color: '#e0dde5',
						}}
					>
						<span>Name:</span>
						<input
							type="text"
							placeholder="Filter by name"
							style={{
								background: 'rgba(237, 232, 242, 0.05)',
								border: '1px solid rgba(255, 255, 255, 0.1)',
								borderRadius: '4px',
								padding: '4px 8px',
								color: '#e0dde5',
								fontSize: '14px',
								width: '120px',
							}}
						/>
					</div>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '5px',
							padding: '5px 10px',
							background: '#271f36',
							borderRadius: '4px',
							fontSize: '14px',
							color: '#e0dde5',
						}}
					>
						<span>Status:</span>
						<select
							style={{
								background: 'rgba(237, 232, 242, 0.05)',
								border: '1px solid rgba(255, 255, 255, 0.1)',
								borderRadius: '4px',
								padding: '4px 8px',
								color: '#e0dde5',
								fontSize: '14px',
							}}
						>
							<option value="">Any</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '5px',
							padding: '5px 10px',
							background: '#271f36',
							borderRadius: '4px',
							fontSize: '14px',
							color: '#e0dde5',
						}}
					>
						<span>Created:</span>
						<input
							type="date"
							style={{
								background: 'rgba(237, 232, 242, 0.05)',
								border: '1px solid rgba(255, 255, 255, 0.1)',
								borderRadius: '4px',
								padding: '4px 8px',
								color: '#e0dde5',
								fontSize: '14px',
							}}
						/>
					</div>

					<button
						style={{
							padding: '6px 12px',
							background: '#271f36',
							color: '#e0dde5',
							border: '1px solid rgba(255, 255, 255, 0.1)',
							borderRadius: '4px',
							cursor: 'pointer',
							fontSize: '14px',
						}}
					>
						Clear Filters
					</button>
				</div>
			)}
		</div>
	);
};

const meta = {
	title: 'Display/Toolbar',
	component: MockToolbar,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		title: { control: 'text' },
		subtitle: { control: 'text' },
		onExportToCSV: { action: 'exported to CSV' },
		showFilters: { control: 'boolean' },
	},
	decorators: [
		(Story) => (
			<div
				style={{ padding: '1rem', maxWidth: '1200px', background: '#1E1A25', borderRadius: '8px' }}
			>
				{Story()}
			</div>
		),
	],
} as Meta<typeof MockToolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default toolbar with title, subtitle, and filters
export const Default: Story = {
	args: {
		title: 'Users',
		subtitle: 'Manage your user accounts',
		showFilters: true,
	},
};

// Toolbar with export functionality
export const WithExport: Story = {
	args: {
		title: 'Products',
		subtitle: 'Manage your product catalog',
		onExportToCSV: fn(),
		showFilters: true,
	},
};

// Toolbar without filters
export const WithoutFilters: Story = {
	args: {
		title: 'Dashboard',
		subtitle: 'Overview of system activity',
		showFilters: false,
	},
};

// Toolbar with long title and subtitle
export const LongTitles: Story = {
	args: {
		title: 'Customer Relationship Management and Service Records',
		subtitle:
			'Comprehensive system for tracking customer interactions and support history across departments',
		showFilters: true,
	},
};

// Mobile view of toolbar (stacked layout)
export const MobileView: Story = {
	args: {
		title: 'Orders',
		subtitle: 'Track and manage orders',
		onExportToCSV: fn(),
		showFilters: true,
	},
	parameters: {
		viewport: {
			defaultViewport: 'mobile1',
		},
	},
};
