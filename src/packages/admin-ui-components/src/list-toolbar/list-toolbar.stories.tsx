import { Meta } from '@storybook/react';
import { ListToolBar } from './component';

// Note: Since this component depends on routing context and schema context,
// we're providing a mock implementation for Storybook instead of the actual component.

const meta = {
	title: 'Components/ListToolBar',
	component: ListToolBar,
	parameters: {
		docs: {
			description: {
				component:
					'A toolbar component specifically designed for entity list views, showing entity information and record count.',
			},
		},
	},
	argTypes: {
		count: {
			control: 'number',
			description: 'Number of records for the entity',
		},
		onExportToCSV: {
			action: 'exportToCSV',
			description: 'Function called when the Export to CSV button is clicked',
		},
	},
	decorators: [
		(Story) => (
			<div style={{ padding: '20px', backgroundColor: '#14111a', minHeight: '150px' }}>
				<Story />
			</div>
		),
	],
} as Meta<typeof ListToolBar>;

export default meta;

// Note: This is a mock implementation for Storybook
// The real component relies on routing context that's not available in Storybook
export const MockImplementation = () => {
	return (
		<div>
			<div style={{ marginBottom: '20px' }}>
				<strong>Note:</strong> This is a simplified representation of the ListToolBar component. The
				actual component integrates with Wouter routing and schema context.
			</div>

			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '15px',
					border: '1px solid #444',
					borderRadius: '4px',
					padding: '15px',
					backgroundColor: '#1d1a23',
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
					<div>
						<h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold' }}>User</h1>
						<p style={{ margin: '0', opacity: 0.7, fontSize: '14px' }}>
							From Users Database (42 rows)
						</p>
					</div>

					<div style={{ display: 'flex', gap: '10px' }}>
						<button
							style={{
								padding: '6px 12px',
								backgroundColor: 'transparent',
								color: 'white',
								border: '1px solid #555',
								borderRadius: '4px',
								display: 'flex',
								alignItems: 'center',
								gap: '5px',
								cursor: 'pointer',
							}}
						>
							Open Playground
							<span>→</span>
						</button>

						<button
							style={{
								padding: '6px 12px',
								backgroundColor: 'transparent',
								color: 'white',
								border: '1px solid #555',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Export to CSV
						</button>

						<button
							style={{
								padding: '6px 12px',
								backgroundColor: '#6200ee',
								color: 'white',
								border: 'none',
								borderRadius: '4px',
								cursor: 'pointer',
							}}
						>
							Create New User
						</button>
					</div>
				</div>

				<div
					style={{
						display: 'flex',
						gap: '10px',
						alignItems: 'center',
						paddingBottom: '5px',
					}}
				>
					<span style={{ opacity: 0.7 }}>🔍</span>
					<button
						style={{
							padding: '6px 12px',
							backgroundColor: 'transparent',
							color: 'white',
							border: '1px solid #555',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Clear Filters
					</button>
				</div>
			</div>
		</div>
	);
};

// Example with count variation
export const WithCount = () => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '15px',
				border: '1px solid #444',
				borderRadius: '4px',
				padding: '15px',
				backgroundColor: '#1d1a23',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
				<div>
					<h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold' }}>Product</h1>
					<p style={{ margin: '0', opacity: 0.7, fontSize: '14px' }}>
						From Products Catalog (7 rows)
					</p>
				</div>

				<div style={{ display: 'flex', gap: '10px' }}>
					<button
						style={{
							padding: '6px 12px',
							backgroundColor: '#6200ee',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Create New Product
					</button>
				</div>
			</div>
		</div>
	);
};

// Example without count
export const WithoutCount = () => {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '15px',
				border: '1px solid #444',
				borderRadius: '4px',
				padding: '15px',
				backgroundColor: '#1d1a23',
			}}
		>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
				<div>
					<h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold' }}>Order</h1>
					<p style={{ margin: '0', opacity: 0.7, fontSize: '14px' }}>From Orders Database</p>
				</div>

				<div style={{ display: 'flex', gap: '10px' }}>
					<button
						style={{
							padding: '6px 12px',
							backgroundColor: 'transparent',
							color: 'white',
							border: '1px solid #555',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Export to CSV
					</button>

					<button
						style={{
							padding: '6px 12px',
							backgroundColor: '#6200ee',
							color: 'white',
							border: 'none',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Create New Order
					</button>
				</div>
			</div>
		</div>
	);
};
