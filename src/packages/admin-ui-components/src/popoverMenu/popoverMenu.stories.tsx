import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { useState } from 'react';

import { PopoverMenu } from './component';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
	title: 'Components/PopoverMenu',
	component: PopoverMenu,
	parameters: {
		// Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
		layout: 'centered',
	},
	// This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
	// More on argTypes: https://storybook.js.org/docs/api/argtypes
	argTypes: {
		placement: {
			control: 'select',
			options: [
				'top',
				'bottom',
				'left',
				'right',
				'top-start',
				'top-end',
				'bottom-start',
				'bottom-end',
			],
		},
		offset: { control: 'number' },
		defaultOpen: { control: 'boolean' },
		closeOnClickOutside: { control: 'boolean' },
		closeOnEscape: { control: 'boolean' },
		usePortal: { control: 'boolean' },
		title: { control: 'text' },
		description: { control: 'text' },
	},
	// Use `fn` to spy on the onOpenChange arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
	args: { onOpenChange: fn() },
} as Meta<typeof PopoverMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample menu content component
const SampleMenuContent = () => (
	<div style={{ padding: '8px', minWidth: '150px' }}>
		<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>Edit Item</div>
		<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>Duplicate</div>
		<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', color: 'red' }}>
			Delete
		</div>
	</div>
);

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Default: Story = {
	args: {
		trigger: (
			<button
				style={{
					padding: '8px 16px',
					border: '1px solid #ccc',
					borderRadius: '4px',
					cursor: 'pointer',
				}}
			>
				Open Menu
			</button>
		),
		content: <SampleMenuContent />,
	},
};

export const WithTitle: Story = {
	args: {
		trigger: (
			<button
				style={{
					padding: '8px 16px',
					border: '1px solid #ccc',
					borderRadius: '4px',
					cursor: 'pointer',
				}}
			>
				Actions
			</button>
		),
		title: 'Available Actions',
		content: <SampleMenuContent />,
	},
};

export const WithTitleAndDescription: Story = {
	args: {
		trigger: (
			<button
				style={{
					padding: '8px 16px',
					border: '1px solid #ccc',
					borderRadius: '4px',
					cursor: 'pointer',
				}}
			>
				User Menu
			</button>
		),
		title: 'Account Settings',
		description: 'Manage your account preferences and settings',
		content: (
			<div style={{ padding: '8px', minWidth: '200px' }}>
				<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>
					Profile Settings
				</div>
				<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>Security</div>
				<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>
					Notifications
				</div>
				<hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #eee' }} />
				<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>Sign Out</div>
			</div>
		),
	},
};

export const RenderPropsContent: Story = {
	args: {
		trigger: (
			<button
				style={{
					padding: '8px 16px',
					border: '1px solid #ccc',
					borderRadius: '4px',
					cursor: 'pointer',
				}}
			>
				Interactive Menu
			</button>
		),
		content: ({ onClose, isOpen }: { onClose: () => void; isOpen: boolean }) => (
			<div style={{ padding: '16px', minWidth: '200px' }}>
				<p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>
					Status: {isOpen ? 'Open' : 'Closed'}
				</p>
				<div style={{ display: 'flex', gap: '8px' }}>
					<button
						onClick={onClose}
						style={{
							padding: '4px 8px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Close Menu
					</button>
					<button
						onClick={() => alert('Action performed!')}
						style={{
							padding: '4px 8px',
							border: '1px solid #007bff',
							borderRadius: '4px',
							cursor: 'pointer',
							color: '#007bff',
						}}
					>
						Perform Action
					</button>
				</div>
			</div>
		),
	},
};

// Placement variations
export const TopPlacement: Story = {
	args: {
		...Default.args,
		placement: 'top',
	},
};

export const LeftPlacement: Story = {
	args: {
		...Default.args,
		placement: 'left',
	},
};

export const RightPlacement: Story = {
	args: {
		...Default.args,
		placement: 'right',
	},
};

export const BottomEndPlacement: Story = {
	args: {
		...Default.args,
		placement: 'bottom-end',
	},
};

// Controlled example component
const ControlledPopoverMenu = (args: any) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
			<PopoverMenu
				{...args}
				open={isOpen}
				onOpenChange={setIsOpen}
				trigger={
					<button
						style={{
							padding: '8px 16px',
							border: '1px solid #ccc',
							borderRadius: '4px',
							cursor: 'pointer',
						}}
					>
						Controlled Menu
					</button>
				}
				content={<SampleMenuContent />}
			/>
			<button
				onClick={() => setIsOpen(!isOpen)}
				style={{
					padding: '4px 8px',
					border: '1px solid #007bff',
					borderRadius: '4px',
					cursor: 'pointer',
					color: '#007bff',
				}}
			>
				{isOpen ? 'Close' : 'Open'} Externally
			</button>
		</div>
	);
};

export const Controlled: Story = {
	render: (args) => <ControlledPopoverMenu {...args} />,
};

export const CustomStyling: Story = {
	args: {
		trigger: (
			<button
				style={{
					padding: '12px 24px',
					background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
					color: 'white',
					border: 'none',
					borderRadius: '8px',
					cursor: 'pointer',
					fontWeight: 'bold',
				}}
			>
				Styled Trigger
			</button>
		),
		content: (
			<div
				style={{
					padding: '16px',
					minWidth: '180px',
					background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
					color: 'white',
					borderRadius: '8px',
				}}
			>
				<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>
					Custom Style 1
				</div>
				<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>
					Custom Style 2
				</div>
				<div style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>
					Custom Style 3
				</div>
			</div>
		),
		popoverClassName: 'custom-popover-style',
	},
};

export const NoPortal: Story = {
	args: {
		...Default.args,
		usePortal: false,
		title: 'No Portal Mode',
		description: 'This popover renders inline instead of using a portal',
	},
};

export const NoCloseOnOutside: Story = {
	args: {
		...Default.args,
		closeOnClickOutside: false,
		title: 'Click Protection',
		description: "This menu won't close when clicking outside",
	},
};

export const LargeOffset: Story = {
	args: {
		...Default.args,
		offset: 20,
		title: 'Large Offset',
		description: 'This popover has increased spacing from the trigger',
	},
};
