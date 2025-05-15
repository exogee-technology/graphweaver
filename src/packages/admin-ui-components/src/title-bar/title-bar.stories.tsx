import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { TitleBar } from './component';

// Create a mock component that doesn't depend on the actual hooks
const MockTitleBar = (props: {
	title: string;
	subtitle: string;
	onExportToCSV?: () => void;
	readOnly?: boolean;
}) => {
	return (
		<div
			className="mock-title-bar"
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'flex-end',
				width: '100%',
			}}
		>
			<div>
				<h1 style={{ margin: '0 0 4px 0', fontSize: '28px', color: '#e0dde5' }}>{props.title}</h1>
				<p style={{ margin: 0, fontSize: '14px', color: 'rgba(224, 221, 229, 0.7)' }}>
					{props.subtitle}
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

				{props.onExportToCSV && (
					<button
						onClick={props.onExportToCSV}
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
					disabled={props.readOnly}
					style={{
						padding: '8px 16px',
						background: '#7C5DC7',
						color: '#e0dde5',
						border: 'none',
						borderRadius: '6px',
						cursor: props.readOnly ? 'not-allowed' : 'pointer',
						opacity: props.readOnly ? 0.5 : 1,
					}}
				>
					Create New User
				</button>
			</div>
		</div>
	);
};

const meta = {
	title: 'Components/TitleBar',
	component: MockTitleBar,
	parameters: {
		layout: 'padded',
	},
	argTypes: {
		title: { control: 'text' },
		subtitle: { control: 'text' },
		onExportToCSV: { action: 'exported to CSV' },
		readOnly: { control: 'boolean' },
	},
	decorators: [(Story) => <div style={{ padding: '1rem', maxWidth: '1200px' }}>{Story()}</div>],
} as Meta<typeof MockTitleBar>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic title bar
export const Default: Story = {
	args: {
		title: 'Users',
		subtitle: 'Manage your user accounts',
	},
};

// Title bar with export functionality
export const WithExport: Story = {
	args: {
		title: 'Products',
		subtitle: 'Manage your product catalog',
		onExportToCSV: fn(),
	},
};

// Title bar with long title and subtitle
export const LongTitles: Story = {
	args: {
		title: 'Customer Relationship Management and Service Tracking System',
		subtitle:
			'Comprehensive dashboard for managing customer interactions, support tickets, and relationship history across all departments and regions',
	},
};

// Title bar on mobile viewport
export const MobileView: Story = {
	args: {
		title: 'Invoices',
		subtitle: 'Manage your billing',
		onExportToCSV: fn(),
	},
	parameters: {
		viewport: {
			defaultViewport: 'mobile1',
		},
	},
};

// Title bar with read-only entity
export const ReadOnlyEntity: Story = {
	args: {
		title: 'Audit Logs',
		subtitle: 'View system activity',
		readOnly: true,
	},
};
